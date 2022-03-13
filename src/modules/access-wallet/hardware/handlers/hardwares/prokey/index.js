import Trezor from 'trezor-connect';
import WALLET_TYPES from '@/modules/access-wallet/common/walletTypes';
// import bip44Paths from '@/modules/access-wallet/hardware/handlers/bip44';
import HDWalletInterface from '@/modules/access-wallet/common/HDWalletInterface';
import * as HDKey from 'hdkey';
import { Transaction, FeeMarketEIP1559Transaction } from '@ethereumjs/tx';
import {
  getSignTransactionObject,
  getHexTxObject,
  getBufferFromHex,
  calculateChainIdFromV,
  eip1559Params
} from '@/modules/access-wallet/common/helpers';
import toBuffer from '@/core/helpers/toBuffer';
import errorHandler from './errorHandler';
import store from '@/core/store';
import commonGenerator from '@/core/helpers/commonGenerator';
import Vue from 'vue';
import prokey from '@/assets/images/icons/wallets/prokey.png';
const NEED_PASSWORD = false;

class ProkeyWallet {
  constructor() {
    this.popup = null;
    this.identifier = WALLET_TYPES.PROKEY;
    this.isHardware = true;
    this.needPassword = NEED_PASSWORD;
    // this.supportedPaths = bip44Paths[WALLET_TYPES.TREZOR];
    this.model = '';
    this.meta = {
      name: 'Prokey',
      img: {
        type: 'img',
        value: prokey
      }
    };
  }

  openProkeyLink() {
    this.popup = window.open('http://localhost:4200/');
    window.addEventListener(
      'message',
      event => {
        alert(event.data);
      },
      false
    );
  }

  async init() {
    // this.basePath = this.supportedPaths[0].path;
    // this.openProkeyLink();
    // const rootPub = await getRootPubKey(this.basePath);
    const xpub =
      'xpub6FwxoKkrViXu5cuesBeLyUqxGzvfBZE1HhawJC7wNdBDpmwKBNfPMTYcnxe21jSP22gp3WPmZwU' +
      'awgHmZKUi4JxJhGT6sLfB6crGnAwQ9WP';
    this.hdKey = HDKey.fromExtendedKey(xpub);
  }
  getAccount(idx) {
    console.log(idx);
    const derivedKey = this.hdKey.derive('m/' + idx);
    const txSigner = async tx => {
      const _tx = new Transaction(tx, {
        common: commonGenerator(store.getters['global/network'])
      });
      const legacySigner = async _txParams => {
        const networkId = _tx.common.chainId();
        const options = {
          path: this.basePath + '/' + idx,
          transaction: getHexTxObject(_tx)
        };
        const result = await Trezor.ethereumSignTransaction(options);
        if (!result.success) throw new Error(result.payload.error);
        _txParams.v = getBufferFromHex(result.payload.v);
        _txParams.r = getBufferFromHex(result.payload.r);
        _txParams.s = getBufferFromHex(result.payload.s);
        const signedChainId = calculateChainIdFromV(_txParams.v);
        if (signedChainId !== networkId)
          throw new Error(
            Vue.$i18n.t('errorsGlobal.invalid-network-id-sig', {
              got: signedChainId,
              expected: networkId
            }),
            'InvalidNetworkId'
          );
        return getSignTransactionObject(Transaction.fromTxData(_txParams));
      };
      if (
        store.getters['global/isEIP1559SupportedNetwork'] &&
        this.model === 'T'
      ) {
        const feeMarket = store.getters['global/gasFeeMarketInfo'];
        const txParams = getHexTxObject(_tx);
        Object.assign(txParams, eip1559Params(txParams.gasPrice, feeMarket));
        delete txParams.gasPrice;
        try {
          const options = {
            path: this.basePath + '/' + idx,
            transaction: txParams
          };

          const result = await Trezor.ethereumSignTransaction(options);
          if (!result.success) throw new Error(result.payload.error);
          txParams.v = getBufferFromHex(result.payload.v);
          txParams.r = getBufferFromHex(result.payload.r);
          txParams.s = getBufferFromHex(result.payload.s);
          return getSignTransactionObject(
            FeeMarketEIP1559Transaction.fromTxData(txParams)
          );
        } catch (e) {
          //unsupported trezor version
          if (e.message === 'Parameter "gasPrice" is missing.')
            return legacySigner(tx);
          throw e;
        }
      } else {
        return legacySigner(tx);
      }
    };
    const msgSigner = async msg => {
      const result = await Trezor.ethereumSignMessage({
        path: this.basePath + '/' + idx,
        message: toBuffer(msg).toString('hex'),
        hex: true
      });
      if (!result.success) throw new Error(result.payload.error);
      return getBufferFromHex(result.payload.signature);
    };
    const displayAddress = async () => {
      // await Trezor.ethereumGetAddress({
      //   path: this.basePath + '/' + idx,
      //   showOnTrezor: true
      // });
      return '123';
    };
    return new HDWalletInterface(
      this.basePath + '/' + idx,
      derivedKey.publicKey,
      this.isHardware,
      this.identifier,
      errorHandler,
      txSigner,
      msgSigner,
      displayAddress,
      this.meta
    );
  }
  getCurrentPath() {
    return this.basePath;
  }
  // getSupportedPaths() {
  //   return this.supportedPaths;
  // }
}
const createWallet = async basePath => {
  const _prokeyWallet = new ProkeyWallet();
  await _prokeyWallet.init(basePath);
  return _prokeyWallet;
};
createWallet.errorHandler = errorHandler;
// const getRootPubKey = async _path => {
//   const result = await Trezor.ethereumGetPublicKey({ path: _path });
//   if (!result.payload) {
//     throw new Error('popup failed to open');
//   }
//   if (!result.success) throw new Error(result.payload.error);
//   return {
//     publicKey: result.payload.publicKey,
//     chainCode: result.payload.chainCode
//   };
// };

export default createWallet;
