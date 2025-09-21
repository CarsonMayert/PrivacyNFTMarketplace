const { ethers } = require("hardhat");

async function main() {
  console.log("📊 Final Gas Cost Comparison\n");

  const results = {
    original: 2987808,  // 原始复杂版本
    mini: 1536497       // 实际测试的极简版本
  };

  console.log("🔍 Contract Versions:");
  console.log("  - Original (PrivacyNFTMarketplaceSimple): " + results.original.toLocaleString() + " gas");
  console.log("  - Mini (PrivacyNFTMarketplaceMini): " + results.mini.toLocaleString() + " gas");

  const savings = results.original - results.mini;
  const savingsPercent = ((savings / results.original) * 100).toFixed(1);

  console.log("\n💰 Gas Savings:");
  console.log("  - Absolute Savings: " + savings.toLocaleString() + " gas");
  console.log("  - Percentage Savings: " + savingsPercent + "%");

  console.log("\n📈 Cost Comparison at Different Gas Prices:");

  const gasPrices = [
    { name: "Low (5 gwei)", gwei: 5 },
    { name: "Standard (20 gwei)", gwei: 20 },
    { name: "Fast (50 gwei)", gwei: 50 }
  ];

  gasPrices.forEach(({ name, gwei }) => {
    const gasPrice = ethers.parseUnits(gwei.toString(), "gwei");

    const originalCost = ethers.formatEther(BigInt(results.original) * gasPrice);
    const miniCost = ethers.formatEther(BigInt(results.mini) * gasPrice);
    const costSavings = parseFloat(originalCost) - parseFloat(miniCost);

    console.log(`\n  ${name}:`);
    console.log(`    - Original: ${originalCost} ETH`);
    console.log(`    - Mini: ${miniCost} ETH`);
    console.log(`    - Savings: ${costSavings.toFixed(6)} ETH`);
  });

  console.log("\n🎯 Recommended for Production:");
  console.log("  - Contract: PrivacyNFTMarketplaceMini");
  console.log("  - Deployment Cost: ~0.037 ETH (at 20 gwei)");
  console.log("  - Minimum Account Balance: 0.05 ETH");

  console.log("\n✨ Features Retained in Mini Version:");
  console.log("  ✅ FHE encrypted prices");
  console.log("  ✅ NFT minting and trading");
  console.log("  ✅ Access control for encrypted data");
  console.log("  ✅ Basic marketplace functionality");
  console.log("  ✅ Fee collection system");

  console.log("\n📝 Features Removed to Save Gas:");
  console.log("  ❌ Complex metadata structures");
  console.log("  ❌ Multiple mappings and arrays");
  console.log("  ❌ Advanced user profiles");
  console.log("  ❌ Category and rarity systems");
  console.log("  ❌ Offer system");
  console.log("  ❌ ReentrancyGuard (using simple checks)");

}

main()
  .then(() => {
    console.log("\n🏆 Gas optimization completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Comparison failed:", error);
    process.exit(1);
  });