import { TonProvider } from './provider/index';
import { TonApi } from './provider/tonapi';
import { ExtensionTonConnectInjectedBridge } from './provider/tonconnect';

const havePrevInstance = !!window.tonkeeper;

const provider = new TonProvider(window?.tonkeeper?.provider);
const tonconnect = new ExtensionTonConnectInjectedBridge(provider);
const tonapi = new TonApi(provider);

window.tonkeeper = {
    provider,
    tonconnect
};
window.tonapi = tonapi;

if (!havePrevInstance) {
    window.dispatchEvent(new Event('tonready'));
}
