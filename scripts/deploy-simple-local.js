const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting simple local deployment...");

  try {
    // Get the contract factory
    const PrivacyNFTMarketplace = await ethers.getContractFactory("PrivacyNFTMarketplaceSimple");

    // Get deployment account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

    // Set fee collector (deployer by default)
    const feeCollector = deployer.address;
    console.log("🏦 Fee collector address:", feeCollector);

    // Deploy the contract with increased gas limit
    console.log("⏳ Deploying PrivacyNFTMarketplaceSimple...");
    const marketplace = await PrivacyNFTMarketplace.deploy(feeCollector, {
      gasLimit: 10000000  // 10M gas limit
    });

    // Wait for deployment
    await marketplace.waitForDeployment();
    const contractAddress = await marketplace.getAddress();

    console.log("✅ PrivacyNFTMarketplaceSimple deployed to:", contractAddress);

    // Basic verification
    console.log("🔍 Verifying contract setup...");

    const marketplaceFee = await marketplace.marketplaceFee();
    const currentFeeCollector = await marketplace.feeCollector();
    const owner = await marketplace.owner();

    console.log("📊 Contract Configuration:");
    console.log("  - Marketplace Fee:", marketplaceFee.toString(), "basis points");
    console.log("  - Fee Collector:", currentFeeCollector);
    console.log("  - Contract Owner:", owner);

    console.log("\n🎉 Deployment completed successfully!");
    return contractAddress;

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);

    if (error.message.includes("stack too deep")) {
      console.log("💡 Stack too deep error detected. The contract compiled but deployment failed.");
      console.log("   This might be resolved by using a different network or configuration.");
    }

    throw error;
  }
}

// Execute deployment
main()
  .then((contractAddress) => {
    console.log(`\n✨ Contract deployed at: ${contractAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });