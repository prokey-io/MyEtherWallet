import WALLET_TYPES from '@/modules/access-wallet/common/walletTypes';
import bip44Paths from '@/modules/access-wallet/hardware/handlers/bip44';
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
import { CommandType, openProkeyLink } from './utils';
const NEED_PASSWORD = false;

class ProkeyWallet {
  constructor() {
    this.identifier = WALLET_TYPES.PROKEY;
    this.isHardware = true;
    this.needPassword = NEED_PASSWORD;
    this.supportedPaths = bip44Paths[WALLET_TYPES.PROKEY];
    this.model = '';
    this.meta = {
      name: 'Prokey',
      img: {
        type: 'img',
        value: prokey
      }
    };
  }

  async init(basePath) {
    this.basePath = basePath ? basePath : this.supportedPaths[0].path;
    const { xpub } = await openProkeyLink(
      { path: this.basePath },
      CommandType.GetEthereumPublicKey
    );
    this.hdKey = HDKey.fromExtendedKey(xpub);
  }
  getAccount(idx) {
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
        const result = await openProkeyLink(
          options,
          CommandType.SignTransaction
        );
        _txParams.v = getBufferFromHex(result.v);
        _txParams.r = getBufferFromHex(result.r);
        _txParams.s = getBufferFromHex(result.s);
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
      console.log(store.getters['global/isEIP1559SupportedNetwork']);
      if (store.getters['global/isEIP1559SupportedNetwork']) {
        const feeMarket = store.getters['global/gasFeeMarketInfo'];
        const txParams = getHexTxObject(_tx);
        Object.assign(txParams, eip1559Params(txParams.gasPrice, feeMarket));
        delete txParams.gasPrice;
        try {
          const options = {
            path: this.basePath + '/' + idx,
            transaction: txParams
          };
          const result = await openProkeyLink(
            options,
            CommandType.SignTransaction
          );
          txParams.v = getBufferFromHex(result.v);
          txParams.r = getBufferFromHex(result.r);
          txParams.s = getBufferFromHex(result.s);
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
      const params = {
        path: this.basePath,
        message: toBuffer(msg).toString()
      };
      const result = await openProkeyLink(params, CommandType.SignMessage);
      return getBufferFromHex(result.signature);
    };
    const displayAddress = async () => {
      const { address } = await openProkeyLink(
        { path: this.basePath },
        CommandType.GetAddress
      );
      return address;
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
  getSupportedPaths() {
    return this.supportedPaths;
  }
}
const createWallet = async basePath => {
  const _prokeyWallet = new ProkeyWallet();
  await _prokeyWallet.init(basePath);
  return _prokeyWallet;
};
createWallet.errorHandler = errorHandler;

export default createWallet;
