// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { FHE, euint8, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title PrivacyNFTMarketplaceSimple
 * @dev Simplified confidential NFT marketplace using Zama FHE protocol
 * @notice Enables privacy-preserving NFT trading with encrypted data
 */
contract PrivacyNFTMarketplaceSimple is ERC721, ReentrancyGuard, Ownable {

    enum ListingStatus { Active, Sold, Cancelled }
    enum RarityTier { Common, Rare, Epic, Legendary }

    struct NFTListing {
        uint256 tokenId;
        address seller;
        uint256 price;
        ListingStatus status;
        uint256 listedAt;
        uint256 expiresAt;
        euint32 encryptedPrice;
        bool isConfidentialSale;
    }

    struct NFTMetadata {
        string name;
        string description;
        string category;
        RarityTier rarity;
        bool isPrivateOwnership;
        uint256 views;
        uint256 offers;
    }

    struct UserProfile {
        mapping(uint256 => euint32) encryptedBalances;
        mapping(uint256 => bool) ownedTokens;
        euint32 encryptedPurchaseCount;
        euint32 encryptedSalesCount;
        uint256 totalSpent;
        uint256 totalEarned;
        uint256 reputationScore;
        bool isVerified;
    }

    uint256 private _tokenIds;

    mapping(uint256 => NFTListing) public listings;
    mapping(uint256 => NFTMetadata) public metadata;
    mapping(address => UserProfile) public userProfiles;
    mapping(address => uint256[]) public userTokens;
    mapping(string => uint256[]) public categoryTokens;
    mapping(RarityTier => uint256[]) public rarityTokens;

    uint256 public marketplaceFee = 250; // 2.5%
    uint256 public constant MAX_FEE = 1000; // 10%
    uint256 public constant LISTING_DURATION = 30 days;

    address public feeCollector;
    uint256 public totalVolume;
    uint256 public totalSales;

    event NFTListed(
        uint256 indexed tokenId,
        address indexed seller,
        string name,
        string category,
        RarityTier rarity,
        uint256 price,
        bool isPrivate,
        uint256 timestamp
    );

    event NFTPurchased(
        uint256 indexed tokenId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        bool wasPrivateSale,
        uint256 timestamp
    );

    modifier tokenExists(uint256 _tokenId) {
        require(_exists(_tokenId), "PrivacyNFTMarketplaceSimple: Token does not exist");
        _;
    }

    modifier onlyTokenOwner(uint256 _tokenId) {
        require(ownerOf(_tokenId) == msg.sender, "PrivacyNFTMarketplaceSimple: Not token owner");
        _;
    }

    modifier listingExists(uint256 _tokenId) {
        require(listings[_tokenId].tokenId != 0, "PrivacyNFTMarketplaceSimple: Listing not found");
        _;
    }

    constructor(
        address _feeCollector
    ) ERC721("Privacy Collectibles", "PNFT") Ownable(msg.sender) {
        require(_feeCollector != address(0), "PrivacyNFTMarketplaceSimple: Invalid fee collector");
        feeCollector = _feeCollector;
    }

    /**
     * @dev Mint new privacy NFT
     */
    function mintNFT(
        address _to,
        string memory _name,
        string memory _description,
        string memory _category,
        RarityTier _rarity,
        bool _isPrivateOwnership
    ) external returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _mint(_to, newTokenId);

        // Initialize with basic listing structure (not listed yet)
        listings[newTokenId] = NFTListing({
            tokenId: newTokenId,
            seller: _to,
            price: 0,
            status: ListingStatus.Cancelled, // Not listed
            listedAt: 0,
            expiresAt: 0,
            encryptedPrice: FHE.asEuint32(uint32(0)),
            isConfidentialSale: false
        });

        // Initialize metadata separately
        metadata[newTokenId] = NFTMetadata({
            name: _name,
            description: _description,
            category: _category,
            rarity: _rarity,
            isPrivateOwnership: _isPrivateOwnership,
            views: 0,
            offers: 0
        });

        // Update user profile
        userProfiles[_to].ownedTokens[newTokenId] = true;
        userTokens[_to].push(newTokenId);
        categoryTokens[_category].push(newTokenId);
        rarityTokens[_rarity].push(newTokenId);

        // Initialize encrypted counters if first time
        if (userTokens[_to].length == 1) {
            userProfiles[_to].encryptedPurchaseCount = FHE.asEuint32(uint32(0));
            userProfiles[_to].encryptedSalesCount = FHE.asEuint32(uint32(0));
            FHE.allowThis(userProfiles[_to].encryptedPurchaseCount);
            FHE.allowThis(userProfiles[_to].encryptedSalesCount);
            FHE.allow(userProfiles[_to].encryptedPurchaseCount, _to);
            FHE.allow(userProfiles[_to].encryptedSalesCount, _to);
        }

        return newTokenId;
    }

    /**
     * @dev List NFT for sale with privacy options
     */
    function listNFT(
        uint256 _tokenId,
        uint256 _price,
        bool _isConfidentialSale
    ) external nonReentrant tokenExists(_tokenId) onlyTokenOwner(_tokenId) {
        require(_price >= 10000000000000, "PrivacyNFTMarketplaceSimple: Price must be at least 0.00001 ETH");
        require(listings[_tokenId].status != ListingStatus.Active, "PrivacyNFTMarketplaceSimple: Already listed");

        // Encrypt the price using FHE
        euint32 encryptedPrice = FHE.asEuint32(uint32(_price));
        FHE.allowThis(encryptedPrice);
        FHE.allow(encryptedPrice, msg.sender);

        // Update listing
        NFTListing storage listing = listings[_tokenId];
        listing.seller = msg.sender;
        listing.price = _price;
        listing.status = ListingStatus.Active;
        listing.listedAt = block.timestamp;
        listing.expiresAt = block.timestamp + LISTING_DURATION;
        listing.encryptedPrice = encryptedPrice;
        listing.isConfidentialSale = _isConfidentialSale;

        emit NFTListed(
            _tokenId,
            msg.sender,
            metadata[_tokenId].name,
            metadata[_tokenId].category,
            metadata[_tokenId].rarity,
            _price,
            _isConfidentialSale,
            block.timestamp
        );
    }

    /**
     * @dev Purchase NFT with privacy protection
     */
    function purchaseNFT(
        uint256 _tokenId,
        bool _isPrivatePurchase
    ) external payable nonReentrant tokenExists(_tokenId) listingExists(_tokenId) {
        NFTListing storage listing = listings[_tokenId];

        require(listing.status == ListingStatus.Active, "PrivacyNFTMarketplaceSimple: NFT not for sale");
        require(listing.seller != msg.sender, "PrivacyNFTMarketplaceSimple: Cannot buy own NFT");
        require(msg.value >= listing.price, "PrivacyNFTMarketplaceSimple: Insufficient payment");
        require(block.timestamp <= listing.expiresAt, "PrivacyNFTMarketplaceSimple: Listing expired");

        // Update listing status
        listing.status = ListingStatus.Sold;

        // Transfer NFT ownership
        _transfer(listing.seller, msg.sender, _tokenId);

        // Process payment and update profiles
        _processPayment(_tokenId, listing.seller, listing.price);

        // Update FHE encrypted counts
        _updateEncryptedCounts(msg.sender, listing.seller);

        // Emit events
        emit NFTPurchased(_tokenId, msg.sender, listing.seller, listing.price,
                         listing.isConfidentialSale || _isPrivatePurchase, block.timestamp);
    }

    /**
     * @dev Get NFT metadata
     */
    function getNFTMetadata(uint256 _tokenId) external view returns (NFTMetadata memory) {
        require(_exists(_tokenId), "PrivacyNFTMarketplaceSimple: Token does not exist");
        return metadata[_tokenId];
    }

    /**
     * @dev Get marketplace statistics
     */
    function getMarketplaceStats() external view returns (
        uint256 totalTokens,
        uint256 activeListings,
        uint256 marketVolume,
        uint256 salesCount
    ) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= _tokenIds; i++) {
            if (listings[i].status == ListingStatus.Active &&
                block.timestamp <= listings[i].expiresAt) {
                activeCount++;
            }
        }

        return (_tokenIds, activeCount, totalVolume, totalSales);
    }

    /**
     * @dev Update marketplace fee (only owner)
     */
    function updateMarketplaceFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE, "PrivacyNFTMarketplaceSimple: Fee too high");
        marketplaceFee = _newFee;
    }

    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Check if token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId <= _tokenIds;
    }

    /**
     * @dev Process payment and transfer funds
     */
    function _processPayment(uint256 _tokenId, address _seller, uint256 _price) internal {
        uint256 fee = (_price * marketplaceFee) / 10000;
        uint256 sellerAmount = _price - fee;

        // Update marketplace stats
        totalVolume += _price;
        totalSales++;

        // Update user profiles
        userProfiles[msg.sender].ownedTokens[_tokenId] = true;
        userProfiles[_seller].ownedTokens[_tokenId] = false;
        userProfiles[msg.sender].totalSpent += _price;
        userProfiles[_seller].totalEarned += sellerAmount;

        // Transfer payments
        payable(_seller).transfer(sellerAmount);
        if (fee > 0) {
            payable(feeCollector).transfer(fee);
        }

        // Return excess payment
        if (msg.value > _price) {
            payable(msg.sender).transfer(msg.value - _price);
        }
    }

    /**
     * @dev Update encrypted purchase/sale counts using FHE
     */
    function _updateEncryptedCounts(address _buyer, address _seller) internal {
        // Encrypt purchase/sale counts using FHE
        euint32 oneValue = FHE.asEuint32(uint32(1));
        userProfiles[_buyer].encryptedPurchaseCount = FHE.add(
            userProfiles[_buyer].encryptedPurchaseCount,
            oneValue
        );
        userProfiles[_seller].encryptedSalesCount = FHE.add(
            userProfiles[_seller].encryptedSalesCount,
            oneValue
        );

        // Allow buyers and sellers to read their own encrypted counts
        FHE.allowThis(userProfiles[_buyer].encryptedPurchaseCount);
        FHE.allow(userProfiles[_buyer].encryptedPurchaseCount, _buyer);
        FHE.allowThis(userProfiles[_seller].encryptedSalesCount);
        FHE.allow(userProfiles[_seller].encryptedSalesCount, _seller);
    }
}