import { TonProvider } from './provider/index';
import { TonConnect } from './provider/tonconnect';

const havePrevInstance = !!window.tonkeeper;

const provider = new TonProvider(window?.tonkeeper?.provider);
const tonconnect = new TonConnect(provider, window?.tonkeeper?.tonconnect);

window.tonkeeper = {
  provider,
  tonconnect,
};

if (!havePrevInstance) {
  window.dispatchEvent(new Event('tonready'));
}
