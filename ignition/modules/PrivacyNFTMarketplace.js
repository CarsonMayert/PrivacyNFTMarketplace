const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("PrivacyNFTMarketplaceModule", (m) => {
  // Get deployer account
  const deployer = m.getAccount(0);

  // Set fee collector (can be changed later by owner)
  const feeCollector = m.getParameter("feeCollector", deployer);

  // Deploy PrivacyNFTMarketplace contract
  const marketplace = m.contract("PrivacyNFTMarketplace", [feeCollector], {
    from: deployer,
  });

  // Return the deployed contract
  return { marketplace };
});