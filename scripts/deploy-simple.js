const { ethers } = require("hardhat");

async function main() {
    console.log("Starting Simple FHE Marketplace deployment...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Get fee collector from command line args or use deployer
    const feeCollector = process.env.FEE_COLLECTOR || deployer.address;
    console.log("Fee collector address:", feeCollector);

    // Deploy the contract
    console.log("Deploying SimpleFHEMarketplace...");
    const SimpleFHEMarketplace = await ethers.getContractFactory("SimpleFHEMarketplace");
    const marketplace = await SimpleFHEMarketplace.deploy(feeCollector);

    await marketplace.waitForDeployment();
    const address = await marketplace.getAddress();

    console.log("✅ SimpleFHEMarketplace deployed to:", address);
    console.log("📋 Contract deployment details:");
    console.log("- Name:", "Privacy Collectibles");
    console.log("- Symbol:", "PNFT");
    console.log("- Fee Collector:", feeCollector);
    console.log("- Network:", (await deployer.provider.getNetwork()).name);

    // Save deployment info
    const fs = require('fs');
    const deploymentInfo = {
        contractAddress: address,
        feeCollector: feeCollector,
        deployedAt: new Date().toISOString(),
        network: (await deployer.provider.getNetwork()).name,
        blockNumber: await deployer.provider.getBlockNumber()
    };

    fs.writeFileSync('deployment-simple.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to deployment-simple.json");

    return {
        contractAddress: address,
        feeCollector: feeCollector
    };
}

// Handle both direct execution and module export
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Deployment failed:", error);
            process.exit(1);
        });
} else {
    module.exports = main;
}