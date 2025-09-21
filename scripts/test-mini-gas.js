const { ethers } = require("hardhat");

async function main() {
  console.log("⛽ Testing PrivacyNFTMarketplaceMini gas costs...\n");

  try {
    // Get the contract factory
    const PrivacyNFTMarketplaceMini = await ethers.getContractFactory("PrivacyNFTMarketplaceMini");

    // Get deployment account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Testing with account:", deployer.address);

    // Estimate deployment gas
    console.log("⏳ Estimating deployment gas...");
    const deploymentTx = await PrivacyNFTMarketplaceMini.getDeployTransaction();
    const estimatedGas = await ethers.provider.estimateGas(deploymentTx);

    console.log("📊 Gas Estimation Results:");
    console.log("  - Estimated Gas Units:", estimatedGas.toString());
    console.log("  - Gas Units (formatted):", Number(estimatedGas).toLocaleString());

    // Get current gas price
    const gasPrice = await ethers.provider.getFeeData();

    // Calculate costs at different gas prices
    const gasPrices = [
      { name: "Low (5 gwei)", price: ethers.parseUnits("5", "gwei") },
      { name: "Standard (20 gwei)", price: ethers.parseUnits("20", "gwei") },
      { name: "Fast (50 gwei)", price: ethers.parseUnits("50", "gwei") }
    ];

    console.log("\n📈 Cost at Different Gas Prices:");
    gasPrices.forEach(({ name, price }) => {
      const cost = estimatedGas * price;
      const costEth = ethers.formatEther(cost);
      console.log(`  - ${name}: ${costEth} ETH`);
    });

    // Actual deployment test
    console.log("\n🧪 Performing actual deployment...");
    const marketplace = await PrivacyNFTMarketplaceMini.deploy();

    // Wait for deployment and get transaction
    await marketplace.waitForDeployment();
    const deployTx = marketplace.deploymentTransaction();

    if (deployTx) {
      const receipt = await deployTx.wait();
      console.log("\n✅ Actual Deployment Results:");
      console.log("  - Gas Used:", receipt.gasUsed.toString());
      console.log("  - Gas Used (formatted):", Number(receipt.gasUsed).toLocaleString());
      console.log("  - Actual Cost:", ethers.formatEther(receipt.gasUsed * receipt.gasPrice), "ETH");
      console.log("  - Contract Address:", await marketplace.getAddress());

      // Test basic functionality
      console.log("\n🔧 Testing basic functionality...");

      // Mint NFT
      const mintTx = await marketplace.mint(deployer.address, "Test NFT");
      const mintReceipt = await mintTx.wait();
      console.log("  - Mint Gas Used:", mintReceipt.gasUsed.toString());

      // List NFT
      const listTx = await marketplace.list(1, 1000); // 0.001 ETH
      const listReceipt = await listTx.wait();
      console.log("  - List Gas Used:", listReceipt.gasUsed.toString());

      console.log("\n📋 Optimized Contract Summary:");
      console.log("  - Deployment Gas:", Number(receipt.gasUsed).toLocaleString());
      console.log("  - Mint Gas:", Number(mintReceipt.gasUsed).toLocaleString());
      console.log("  - List Gas:", Number(listReceipt.gasUsed).toLocaleString());
    }

    // Compare with previous version
    console.log("\n📊 Comparison with Previous Version:");
    console.log("  - Previous Contract Gas: ~2,987,808");
    console.log("  - Mini Contract Gas: " + Number(estimatedGas).toLocaleString());

    const savings = 2987808 - Number(estimatedGas);
    const savingsPercent = ((savings / 2987808) * 100).toFixed(1);

    console.log("  - Gas Savings: " + savings.toLocaleString() + " (" + savingsPercent + "%)");

    // Cost savings at 20 gwei
    const oldCost = ethers.formatEther(2987808n * ethers.parseUnits("20", "gwei"));
    const newCost = ethers.formatEther(estimatedGas * ethers.parseUnits("20", "gwei"));

    console.log("\n💰 Cost Comparison (at 20 gwei):");
    console.log("  - Previous Cost: " + oldCost + " ETH");
    console.log("  - Mini Cost: " + newCost + " ETH");
    console.log("  - Cost Savings: " + (parseFloat(oldCost) - parseFloat(newCost)).toFixed(6) + " ETH");

  } catch (error) {
    console.error("❌ Gas test failed:", error.message);
  }
}

// Execute gas test
main()
  .then(() => {
    console.log("\n✨ Gas test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Gas test failed:", error);
    process.exit(1);
  });