import { TonProvider } from './provider/index';
import { TonApi } from './provider/tonapi';
import { ExtensionTonConnectInjectedBridge } from './provider/tonconnect';
import { TonLinksInterceptor } from './provider/links-interceptor';

const havePrevInstance = !!window.tonkeeper;

const provider = new TonProvider(window?.tonkeeper?.provider);
const tonconnect = new ExtensionTonConnectInjectedBridge(provider);
const tonapi = new TonApi(provider);

const linksInterceptor = new TonLinksInterceptor(provider);
linksInterceptor.startInterceptLinks();

window.tonkeeper = {
    provider,
    tonconnect
};
window.tonapi = tonapi;

if (!havePrevInstance) {
    window.dispatchEvent(new Event('tonready'));
}
