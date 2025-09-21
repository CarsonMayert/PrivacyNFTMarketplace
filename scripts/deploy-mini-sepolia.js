const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying PrivacyNFTMarketplaceMini to Sepolia...\n");

  try {
    // Get the contract factory
    const PrivacyNFTMarketplaceMini = await ethers.getContractFactory("PrivacyNFTMarketplaceMini");

    // Get deployment account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

    // Require minimum balance for 5 gwei deployment
    const minBalance = ethers.parseEther("0.02");  // Lower requirement for 5 gwei
    if (balance < minBalance) {
      throw new Error(`Insufficient balance. Need at least 0.02 ETH for 5 gwei deployment, have ${ethers.formatEther(balance)} ETH`);
    }

    // Deploy the contract
    console.log("⏳ Deploying PrivacyNFTMarketplaceMini...");
    console.log("📊 Expected gas: ~1,536,497");
    console.log("💰 Expected cost: ~0.0077 ETH (at 5 gwei - low cost mode)");

    const marketplace = await PrivacyNFTMarketplaceMini.deploy({
      gasLimit: 2000000,  // 2M gas limit (plenty of safety margin)
      gasPrice: ethers.parseUnits("5", "gwei")  // 5 gwei for low cost deployment
    });

    // Wait for deployment
    await marketplace.waitForDeployment();
    const contractAddress = await marketplace.getAddress();

    console.log("✅ PrivacyNFTMarketplaceMini deployed to:", contractAddress);

    // Get deployment transaction details
    const deployTx = marketplace.deploymentTransaction();
    if (deployTx) {
      const receipt = await deployTx.wait();
      console.log("\n📋 Deployment Details:");
      console.log("  - Transaction Hash:", receipt.hash);
      console.log("  - Block Number:", receipt.blockNumber);
      console.log("  - Gas Used:", receipt.gasUsed.toString());
      console.log("  - Gas Price:", ethers.formatUnits(receipt.gasPrice, "gwei"), "gwei");
      console.log("  - Deployment Cost:", ethers.formatEther(receipt.gasUsed * receipt.gasPrice), "ETH");
    }

    // Verify deployment
    console.log("\n🔍 Verifying contract setup...");

    const fee = await marketplace.fee();
    const feeCollector = await marketplace.feeCollector();
    const owner = await marketplace.owner();
    const currentTokenId = await marketplace.getCurrentTokenId();

    console.log("📊 Contract Configuration:");
    console.log("  - Fee Rate:", fee.toString(), "basis points (", (Number(fee) / 100).toFixed(1), "%)");
    console.log("  - Fee Collector:", feeCollector);
    console.log("  - Contract Owner:", owner);
    console.log("  - Current Token ID:", currentTokenId.toString());

    console.log("\n🎉 Deployment completed successfully!");
    console.log("📋 Contract Details:");
    console.log("  - Network: Sepolia");
    console.log("  - Contract Address:", contractAddress);
    console.log("  - Contract Name: PrivacyNFTMarketplaceMini");

    console.log("\n🌐 Links:");
    console.log("  - Etherscan: https://sepolia.etherscan.io/address/" + contractAddress);
    console.log("  - Transaction: https://sepolia.etherscan.io/tx/" + (deployTx?.hash || 'N/A'));

    console.log("\n📝 Next Steps:");
    console.log("  1. Verify contract on Etherscan");
    console.log("  2. Test minting: marketplace.mint(address, 'NFT Name')");
    console.log("  3. Test listing: marketplace.list(tokenId, price)");
    console.log("  4. Test buying: marketplace.buy(tokenId, {value: price})");

    return contractAddress;

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);

    if (error.message.includes("insufficient funds")) {
      console.log("💡 Please add more Sepolia ETH to your account:");
      console.log("   - Get Sepolia ETH from: https://sepoliafaucet.com/");
    }

    throw error;
  }
}

// Execute deployment
main()
  .then((contractAddress) => {
    console.log(`\n✨ Deployment successful!`);
    console.log(`📍 Contract Address: ${contractAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });