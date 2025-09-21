const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Sepolia deployment...");

  try {
    // Get the contract factory
    const PrivacyNFTMarketplaceSimple = await ethers.getContractFactory("PrivacyNFTMarketplaceSimple");

    // Get deployment account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

    // Require minimum balance for deployment
    const minBalance = ethers.parseEther("0.01"); // 0.01 ETH minimum
    if (balance < minBalance) {
      throw new Error(`Insufficient balance. Need at least 0.01 ETH, have ${ethers.formatEther(balance)} ETH`);
    }

    // Set fee collector (deployer by default)
    const feeCollector = deployer.address;
    console.log("🏦 Fee collector address:", feeCollector);

    // Deploy the contract
    console.log("⏳ Deploying PrivacyNFTMarketplaceSimple...");
    const marketplace = await PrivacyNFTMarketplaceSimple.deploy(feeCollector, {
      gasLimit: 8000000  // 8M gas limit for complex FHE contract
    });

    // Wait for deployment
    await marketplace.waitForDeployment();
    const contractAddress = await marketplace.getAddress();

    console.log("✅ PrivacyNFTMarketplaceSimple deployed to:", contractAddress);

    // Verify deployment
    console.log("🔍 Verifying contract setup...");

    const marketplaceFee = await marketplace.marketplaceFee();
    const currentFeeCollector = await marketplace.feeCollector();
    const owner = await marketplace.owner();

    console.log("📊 Contract Configuration:");
    console.log("  - Marketplace Fee:", marketplaceFee.toString(), "basis points");
    console.log("  - Fee Collector:", currentFeeCollector);
    console.log("  - Contract Owner:", owner);

    // Get marketplace stats
    const stats = await marketplace.getMarketplaceStats();
    console.log("📈 Initial Marketplace Stats:");
    console.log("  - Total Tokens:", stats[0].toString());
    console.log("  - Active Listings:", stats[1].toString());
    console.log("  - Total Volume:", ethers.formatEther(stats[2]), "ETH");
    console.log("  - Total Sales:", stats[3].toString());

    console.log("\n🎉 Deployment completed successfully!");
    console.log("📋 Contract Details:");
    console.log("  - Network: Sepolia");
    console.log("  - Contract Address:", contractAddress);
    console.log("  - Transaction Hash:", marketplace.deploymentTransaction()?.hash);

    return contractAddress;

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);

    if (error.message.includes("insufficient funds")) {
      console.log("💡 Please add more Sepolia ETH to your account:");
      console.log("   - Get Sepolia ETH from: https://sepoliafaucet.com/");
      console.log("   - Or use: https://faucets.chain.link/sepolia");
    }

    throw error;
  }
}

// Execute deployment
main()
  .then((contractAddress) => {
    console.log(`\n✨ Contract deployed at: ${contractAddress}`);
    console.log("🌐 View on Etherscan: https://sepolia.etherscan.io/address/" + contractAddress);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });