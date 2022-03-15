const PROKEY_LINK_URL = 'http://localhost:4200';
const MEW_URL = 'https://localhost:8080';

const CommadType = Object.freeze({
  GetEthereumPublicKey: 'GetEthereumPublicKey',
  GetAddress: 'GetAddress'
});

const handleMessage = (event, resolve) => {
  if (event.origin.startsWith(PROKEY_LINK_URL)) {
    resolve(event.data);
    window.removeEventListener('message', handleMessage);
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

export { CommadType, openProkeyLink };
