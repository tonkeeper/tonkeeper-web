import { TonProvider } from './provider/index';
import { TonApi } from './provider/tonapi';
import { TonConnect } from './provider/tonconnect';

const havePrevInstance = !!window.tonkeeper;

const provider = new TonProvider(window?.tonkeeper?.provider);
const tonconnect = new TonConnect(provider);
const tonapi = new TonApi(provider);

window.tonkeeper = {
    provider,
    tonconnect
};
window.tonapi = tonapi;

if (!havePrevInstance) {
    window.dispatchEvent(new Event('tonready'));
}
