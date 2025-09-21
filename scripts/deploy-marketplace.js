const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Privacy NFT Marketplace deployment...");

  // Get the contract factory
  const PrivacyNFTMarketplace = await ethers.getContractFactory("PrivacyNFTMarketplace");

  // Get deployment account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Set fee collector (deployer by default, can be changed later)
  const feeCollector = deployer.address;
  console.log("🏦 Fee collector address:", feeCollector);

  // Deploy the contract
  console.log("⏳ Deploying PrivacyNFTMarketplace...");
  const marketplace = await PrivacyNFTMarketplace.deploy(feeCollector);

  // Wait for deployment
  await marketplace.waitForDeployment();
  const contractAddress = await marketplace.getAddress();

  console.log("✅ PrivacyNFTMarketplace deployed to:", contractAddress);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    feeCollector: feeCollector,
    deployer: deployer.address,
    network: hre.network.name,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    transactionHash: marketplace.deploymentTransaction()?.hash
  };

  // Save to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}-deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("📄 Deployment info saved to:", deploymentFile);

  // Update frontend contract address
  const frontendIndexPath = path.join(__dirname, "../index.html");
  if (fs.existsSync(frontendIndexPath)) {
    let indexContent = fs.readFileSync(frontendIndexPath, 'utf8');

    // Replace contract address in frontend
    const oldAddressPattern = /const CONTRACT_ADDRESS = ['"][^'"]*['"];/;
    const newAddressLine = `const CONTRACT_ADDRESS = '${contractAddress}';`;

    if (oldAddressPattern.test(indexContent)) {
      indexContent = indexContent.replace(oldAddressPattern, newAddressLine);
      fs.writeFileSync(frontendIndexPath, indexContent);
      console.log("🔧 Frontend contract address updated");
    }
  }

  // Verify contract setup
  console.log("🔍 Verifying contract setup...");

  try {
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

  } catch (error) {
    console.log("⚠️  Error verifying contract setup:", error.message);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Next steps:");
  console.log("  1. Update your .env file with the contract address");
  console.log("  2. Verify the contract on Etherscan (if on testnet/mainnet)");
  console.log("  3. Fund the deployer account with testnet ETH");
  console.log("  4. Test the marketplace functionality");

  return contractAddress;
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