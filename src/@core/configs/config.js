function getConfig(env) {
  switch(env) {
    case 'production':
    case 'mainnet':
      return {
        networkId: 'mainnet',
        accountSuffix: '.near',
        nodeUrl: 'https://rpc.mainnet.near.org',
        contractName: 'v1.cryptoblessing.near',
        cbtContractName: 'token.cryptoblessing.near',
        nftContractName: 'nft.cryptoblessing.near',
        walletUrl: 'https://wallet.near.org',
        helperUrl: 'https://helper.mainnet.near.org',
        explorerUrl: 'https://explorer.mainnet.near.org',
      };
    case 'development':
    case 'testnet':
      return {
        networkId: 'testnet',
        accountSuffix: '.testnet',
        nodeUrl: 'https://rpc.testnet.near.org',
        contractName: 'v2.cryptoblessing.testnet',
        cbtContractName: 'token.cryptoblessing.testnet',
        nftContractName: 'nft.cryptoblessing.testnet',
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org',
      };
    default:
      throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`);
  }
}

module.exports = getConfig;
