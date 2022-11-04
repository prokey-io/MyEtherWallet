const PROKEY_LINK_URL = 'https://link.prokey.io';
const MEW_URL = 'https://localhost:8080';

const CommandType = Object.freeze({
  GetEthereumPublicKey: 'GetEthereumPublicKey',
  GetAddress: 'GetAddress',
  SignTransaction: 'SignTransaction',
  SignMessage: 'SignMessage'
});

const handleMessage = (event, resolve) => {
  if (event.origin.startsWith(PROKEY_LINK_URL)) {
    window.removeEventListener('message', handleMessage);
    resolve(event.data);
  }
  if (event.origin.startsWith(MEW_URL)) {
    //BLANK
  }
};

const openProkeyLink = (param, type) =>
  new Promise(resolve => {
    const popup = window.open(PROKEY_LINK_URL);
    setTimeout(() => {
      popup.postMessage({ param, type }, PROKEY_LINK_URL);
    }, 2000);
    window.addEventListener(
      'message',
      event => handleMessage(event, resolve),
      false
    );
  });

export { CommandType, openProkeyLink };
