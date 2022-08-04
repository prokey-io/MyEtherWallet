let tokens;

import('@/_generated/tokens/tokens-bsc.json').then(val => (tokens = val));

import bsc from '@/assets/images/networks/bsc.svg';
export default {
  name: 'BSC',
  name_long: 'Binance Smart Chain',
  homePage: 'https://www.binance.org/en/smartChain',
  blockExplorerTX: 'https://bscscan.com/tx/[[txHash]]',
  blockExplorerAddr: 'https://bscscan.com/address/[[address]]',
  chainID: 56,
  tokens: tokens,
  contracts: [],
  icon: bsc,
  currencyName: 'BNB',
  isTestNetwork: false,
  isEthVMSupported: {
    supported: false,
    url: null,
    websocket: null
  },
  gasPriceMultiplier: 1,
  canBuy: true,
  coingeckoID: 'binancecoin'
};
