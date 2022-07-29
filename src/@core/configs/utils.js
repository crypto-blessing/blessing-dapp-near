// This function takes the input from the Rust smart contract
// and turns it into what the crossword library would like.
// Opportunity to enhance the library so this isn't necessary.
import * as nearAPI from 'near-api-js';
import bs58 from 'bs58';


// Our API could be improved here :)
// See: https://github.com/near/near-api-js/issues/612
async function viewMethodOnContract(nearConfig, method, params) {
  const paramBytes = Buffer.from(params, 'utf8');
  const base58Params = bs58.encode(paramBytes);

  const provider = new nearAPI.providers.JsonRpcProvider(nearConfig.nodeUrl);
  const rawResult = await provider.query(`call/${nearConfig.contractName}/${method}`, base58Params);

  return JSON.parse(rawResult.result.map((x) => String.fromCharCode(x)).join(''));
}

module.exports = {
  viewMethodOnContract,
};
