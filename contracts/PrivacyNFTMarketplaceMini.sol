// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PrivacyNFTMarketplaceMini
 * @dev 极简版隐私NFT市场 - 支持FHE加密
 * @notice 先不继承SepoliaConfig，专注于基本FHE功能
 */
contract PrivacyNFTMarketplaceMini is ERC721, Ownable {

    struct Listing {
        address seller;
        uint32 price;           // 使用uint32节省存储，支持到4294 ETH
        euint32 encryptedPrice; // FHE加密价格
        bool active;
    }

    uint256 private _tokenId;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => string) public tokenNames;

    uint256 public fee = 250; // 2.5%
    address public feeCollector;

    event Listed(uint256 indexed tokenId, address indexed seller, uint32 price);
    event Sold(uint256 indexed tokenId, address indexed buyer, address indexed seller);

    constructor() ERC721("PrivacyNFT", "PNFT") Ownable(msg.sender) {
        feeCollector = msg.sender;
    }

    /**
     * @dev 铸造NFT
     */
    function mint(address to, string memory name) external returns (uint256) {
        _tokenId++;
        _mint(to, _tokenId);
        tokenNames[_tokenId] = name;
        return _tokenId;
    }

    /**
     * @dev 上架NFT
     */
    function list(uint256 tokenId, uint32 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Invalid price");
        require(!listings[tokenId].active, "Already listed");

        // 使用FHE加密价格 - 参考FHEGuessTimed.sol模式
        euint32 encPrice = FHE.asEuint32(price);

        // 设置ACL权限 - 允许合约和消息发送者访问
        FHE.allowThis(encPrice);
        FHE.allow(encPrice, msg.sender);

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            encryptedPrice: encPrice,
            active: true
        });

        emit Listed(tokenId, msg.sender, price);
    }

    /**
     * @dev 购买NFT
     */
    function buy(uint256 tokenId) external payable {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not for sale");
        require(msg.value >= listing.price, "Insufficient payment");

        address seller = listing.seller;
        uint256 salePrice = listing.price;

        // 清除上架信息
        listing.active = false;

        // 转移NFT
        _transfer(seller, msg.sender, tokenId);

        // 处理付款
        uint256 feeAmount = (salePrice * fee) / 10000;
        payable(seller).transfer(salePrice - feeAmount);
        payable(feeCollector).transfer(feeAmount);

        // 退还多余付款
        if (msg.value > salePrice) {
            payable(msg.sender).transfer(msg.value - salePrice);
        }

        emit Sold(tokenId, msg.sender, seller);
    }

    /**
     * @dev 取消上架
     */
    function cancel(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        listings[tokenId].active = false;
    }

    /**
     * @dev 获取加密价格（仅所有者和卖家可见）
     */
    function getEncryptedPrice(uint256 tokenId) external view returns (euint32) {
        require(
            ownerOf(tokenId) == msg.sender ||
            listings[tokenId].seller == msg.sender ||
            msg.sender == owner(),
            "Not authorized"
        );
        return listings[tokenId].encryptedPrice;
    }

    /**
     * @dev 设置费率（仅所有者）
     */
    function setFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // 最大10%
        fee = newFee;
    }

    /**
     * @dev 设置费用收集者（仅所有者）
     */
    function setFeeCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Invalid address");
        feeCollector = newCollector;
    }

    /**
     * @dev 获取NFT名称
     */
    function getName(uint256 tokenId) external view returns (string memory) {
        return tokenNames[tokenId];
    }

    /**
     * @dev 获取当前token ID
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenId;
    }
}