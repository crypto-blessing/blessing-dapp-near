import getConfig from 'src/@core/configs/config'
import * as nearAPI from 'near-api-js';

export const getWalletConnection = async () => {
    // create a keyStore for signing transactions using the user's key
    // which is located in the browser local storage after user logs in
    const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();
    const nearConfig = await getNearConfig();

    // Initializing connection to the NEAR testnet
    const near = await nearAPI.connect({ keyStore, ...nearConfig });

    // Initialize wallet connection
    return new nearAPI.WalletConnection(near);
}


export const getNearConfig = async () => {
    // return getConfig('mainnet');
    
    return getConfig('testnet');
}

export const getCurrentUser = async () => {
    const walletConnection = await getWalletConnection()

    // Load in user's account data
    if (walletConnection.getAccountId()) {
        return walletConnection.getAccountId()
    }

    return null
}