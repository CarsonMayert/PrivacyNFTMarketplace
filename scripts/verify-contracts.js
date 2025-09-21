const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Starting contract verification...");

  // Read deployment info
  const deploymentFile = path.join(__dirname, "../deployments", `${hre.network.name}-deployment.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found. Please deploy contracts first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const contractAddress = deploymentInfo.contractAddress;
  const feeCollector = deploymentInfo.feeCollector;

  console.log("📝 Contract Address:", contractAddress);
  console.log("🏦 Fee Collector:", feeCollector);

  try {
    // Verify on Etherscan
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
      console.log("⏳ Verifying contract on Etherscan...");

      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [feeCollector],
        contract: "contracts/PrivacyNFTMarketplace.sol:PrivacyNFTMarketplace"
      });

      console.log("✅ Contract verified on Etherscan");
    } else {
      console.log("ℹ️  Skipping Etherscan verification (local network)");
    }

    // Verify contract functions
    console.log("🧪 Testing contract functions...");

    const marketplace = await ethers.getContractAt("PrivacyNFTMarketplace", contractAddress);

    // Test read functions
    const owner = await marketplace.owner();
    const feeCollectorAddr = await marketplace.feeCollector();
    const marketplaceFee = await marketplace.marketplaceFee();
    const stats = await marketplace.getMarketplaceStats();

    console.log("📊 Contract Verification Results:");
    console.log("  - Owner:", owner);
    console.log("  - Fee Collector:", feeCollectorAddr);
    console.log("  - Marketplace Fee:", marketplaceFee.toString(), "basis points");
    console.log("  - Total Tokens:", stats[0].toString());
    console.log("  - Active Listings:", stats[1].toString());
    console.log("  - Total Volume:", ethers.formatEther(stats[2]), "ETH");
    console.log("  - Total Sales:", stats[3].toString());

    // Verify contract interface
    const listedNFTs = await marketplace.getListedNFTs();
    console.log("  - Listed NFTs:", listedNFTs.length);

    console.log("\n✅ Contract verification completed successfully!");

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("🎉 Verification process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Verification process failed:", error);
    process.exit(1);
  });