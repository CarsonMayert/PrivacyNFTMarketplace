const fs = require('fs');

// Read the artifact file
const artifact = JSON.parse(fs.readFileSync('./artifacts/contracts/PrivacyNFTMarketplaceMini.sol/PrivacyNFTMarketplaceMini.json', 'utf8'));

// Extract main functions only
const mainFunctions = artifact.abi.filter(item => {
    if (item.type === 'function') {
        const mainFunctionNames = ['mint', 'list', 'buy', 'cancel', 'getName', 'getCurrentTokenId', 'getEncryptedPrice', 'setFee', 'setFeeCollector', 'fee', 'feeCollector', 'owner', 'ownerOf', 'balanceOf'];
        return mainFunctionNames.includes(item.name);
    }
    if (item.type === 'event') {
        return ['Listed', 'Sold'].includes(item.name);
    }
    return item.type === 'constructor';
});

console.log(JSON.stringify(mainFunctions, null, 2));