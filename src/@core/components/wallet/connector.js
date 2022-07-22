import { InjectedConnector } from "@web3-react/injected-connector";


export const injected = new InjectedConnector({
  supportedChainIds: [56, 97, 1337],
});

// export const getWeb3 = (chainId) => {
//   switch (chainId) {
//     case 56:
//       return new Web3(new Web3.providers.WebsocketProvider(process.env.REACT_APP_BSC_MAINNET_WS));
//     case 97:

//       // return new Web3(new Web3.providers.WebsocketProvider(process.env.REACT_APP_BSC_TESTNET_WS));

//       // return new Web3(new Web3.providers.WebsocketProvider("wss://apis.ankr.com/wss/4ba236862ab54a55b364dcd322cdb412/807cff1041c516e514318a326153c1f3/binance/full/test"))
      
//       return new Web3(new Web3.providers.WebsocketProvider("wss://apis.ankr.com/wss/f29548f1f7544067be5efc64aff8735a/807cff1041c516e514318a326153c1f3/binance/full/test"));
//     case 1337:
//       return new Web3(window.ethereum);
//     default:
//       return new Web3(window.ethereum);
//   }
// }