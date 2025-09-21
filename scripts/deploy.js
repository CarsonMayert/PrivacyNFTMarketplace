const { ethers } = require("hardhat");

async function main() {
    console.log("Starting Privacy NFT Marketplace deployment...");

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
    console.log("Deploying PrivacyNFTMarketplace...");
    const PrivacyNFTMarketplace = await ethers.getContractFactory("PrivacyNFTMarketplace");
    const marketplace = await PrivacyNFTMarketplace.deploy(feeCollector);

    await marketplace.waitForDeployment();
    const address = await marketplace.getAddress();

    console.log("✅ PrivacyNFTMarketplace deployed to:", address);
    console.log("📋 Contract deployment details:");
    console.log("- Name:", "Privacy Collectibles");
    console.log("- Symbol:", "PNFT");
    console.log("- Fee Collector:", feeCollector);
    console.log("- Network:", (await deployer.provider.getNetwork()).name);

    // Verify on Etherscan if on testnet/mainnet
    if (process.env.ETHERSCAN_API_KEY && network.name !== "hardhat") {
        console.log("Waiting for block confirmations...");
        await marketplace.deploymentTransaction().wait(6);

        console.log("Verifying contract on Etherscan...");
        try {
            await hre.run("verify:verify", {
                address: address,
                constructorArguments: [feeCollector],
            });
        } catch (error) {
            console.log("Verification failed:", error.message);
        }
    }

    // Save deployment info
    const fs = require('fs');
    const deploymentInfo = {
        contractAddress: address,
        feeCollector: feeCollector,
        deployedAt: new Date().toISOString(),
        network: (await deployer.provider.getNetwork()).name,
        blockNumber: await deployer.provider.getBlockNumber()
    };

    fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to deployment.json");

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