import WalletErrorHandler from '@/modules/access-wallet/common/WalletErrorHandler';

const ERRORS = {
  'Popup closed': 'trezorError.popup-closed',
  'Device disconnected': 'trezorError.device-disconnect',
  Cancelled: 'trezorError.cancelled',
  'Iframe timeout': 'trezorError.iframe-timeout',
  'Browser not supported': 'trezorError.unsupported-browser'
};

const WARNINGS = {};

export default WalletErrorHandler(ERRORS, WARNINGS);
