const { ethers } = require("hardhat");

async function main() {
  console.log("⛽ Estimating gas costs for PrivacyNFTMarketplaceSimple deployment...\n");

  try {
    // Get the contract factory
    const PrivacyNFTMarketplaceSimple = await ethers.getContractFactory("PrivacyNFTMarketplaceSimple");

    // Get deployment account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Estimating with account:", deployer.address);

    // Set fee collector (deployer by default)
    const feeCollector = deployer.address;

    // Estimate deployment gas
    console.log("⏳ Estimating deployment gas...");
    const deploymentTx = await PrivacyNFTMarketplaceSimple.getDeployTransaction(feeCollector);
    const estimatedGas = await ethers.provider.estimateGas(deploymentTx);

    console.log("📊 Gas Estimation Results:");
    console.log("  - Estimated Gas Units:", estimatedGas.toString());
    console.log("  - Gas Units (formatted):", Number(estimatedGas).toLocaleString());

    // Get current gas price
    const gasPrice = await ethers.provider.getFeeData();
    console.log("\n⛽ Current Gas Prices:");
    console.log("  - Gas Price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
    console.log("  - Max Fee Per Gas:", ethers.formatUnits(gasPrice.maxFeePerGas, "gwei"), "gwei");
    console.log("  - Max Priority Fee:", ethers.formatUnits(gasPrice.maxPriorityFeePerGas, "gwei"), "gwei");

    // Calculate costs
    const deploymentCostWei = estimatedGas * gasPrice.gasPrice;
    const deploymentCostEth = ethers.formatEther(deploymentCostWei);

    console.log("\n💰 Estimated Deployment Costs:");
    console.log("  - Cost (Wei):", deploymentCostWei.toString());
    console.log("  - Cost (ETH):", deploymentCostEth);

    // Calculate costs at different gas prices (for Sepolia)
    const gasPrices = [
      { name: "Low (5 gwei)", price: ethers.parseUnits("5", "gwei") },
      { name: "Standard (20 gwei)", price: ethers.parseUnits("20", "gwei") },
      { name: "Fast (50 gwei)", price: ethers.parseUnits("50", "gwei") },
      { name: "Urgent (100 gwei)", price: ethers.parseUnits("100", "gwei") }
    ];

    console.log("\n📈 Cost at Different Gas Prices (Sepolia estimates):");
    gasPrices.forEach(({ name, price }) => {
      const cost = estimatedGas * price;
      const costEth = ethers.formatEther(cost);
      console.log(`  - ${name}: ${costEth} ETH`);
    });

    // Actual deployment test (optional)
    console.log("\n🧪 Performing actual deployment test...");
    const marketplace = await PrivacyNFTMarketplaceSimple.deploy(feeCollector);

    // Wait for deployment and get transaction
    await marketplace.waitForDeployment();
    const deployTx = marketplace.deploymentTransaction();

    if (deployTx) {
      const receipt = await deployTx.wait();
      console.log("\n✅ Actual Deployment Results:");
      console.log("  - Gas Used:", receipt.gasUsed.toString());
      console.log("  - Gas Used (formatted):", Number(receipt.gasUsed).toLocaleString());
      console.log("  - Gas Price:", ethers.formatUnits(receipt.gasPrice, "gwei"), "gwei");
      console.log("  - Actual Cost:", ethers.formatEther(receipt.gasUsed * receipt.gasPrice), "ETH");
      console.log("  - Transaction Hash:", receipt.hash);
      console.log("  - Contract Address:", await marketplace.getAddress());
    }

    console.log("\n📋 Summary for Sepolia Deployment:");
    console.log("  - Recommended Gas Limit: 8,000,000");
    console.log("  - Expected Gas Usage: ~" + Number(estimatedGas).toLocaleString());
    console.log("  - Recommended ETH Balance: 0.05 ETH (safety margin)");
    console.log("  - Minimum ETH Balance: 0.02 ETH");

  } catch (error) {
    console.error("❌ Gas estimation failed:", error.message);

    if (error.message.includes("stack too deep")) {
      console.log("💡 Stack too deep error detected during estimation.");
      console.log("   Estimated gas requirement: 6,000,000 - 8,000,000 gas units");
      console.log("   At 20 gwei: ~0.12 - 0.16 ETH");
    }
  }
}

// Execute gas estimation
main()
  .then(() => {
    console.log("\n✨ Gas estimation completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Gas estimation failed:", error);
    process.exit(1);
  });