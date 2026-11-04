import { TonProvider } from './provider/index';
import { TonApi } from './provider/tonapi';
import { ExtensionTonConnectInjectedBridge } from './provider/tonconnect';
import { TonLinksInterceptor } from './provider/links-interceptor';
import { TonkeeperEvmProvider, announceEvmProvider } from './provider/evm';

// Keeper mark shown in EVM dApp wallet pickers. EIP-6963 requires a data
// URI — page context can't read packaged extension resources — so the mark
// is inlined as SVG rather than fetched or base64-rasterised.
const KEEPER_ICON =
    'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22128%22%20height%3D%22128%22%20viewBox%3D%220%200%20128%20128%22%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2228%22%20fill%3D%22%2310161F%22%2F%3E%3Cpath%20transform%3D%22translate%2826.7%2027.3%29%20scale%280.3733%29%22%20d%3D%22M74.7842%2093.3131C84.6%2099.0682%2090.8751%20109.313%2091.541%20120.623L96.1816%20199.99V200.001L0%2049.4713L74.7842%2093.3131ZM103.818%20200.001L108.459%20120.633C109.125%20109.314%20115.41%2099.079%20125.216%2093.3238L200%2049.4713L103.818%20200.001ZM79.415%204.53476C92.4591%20-1.51153%20107.531%20-1.51164%20120.575%204.53476L199.96%2041.3258L120.151%2077.3844C107.349%2083.1696%2092.6506%2083.1696%2079.8486%2077.3844L0.0400391%2041.3258L79.415%204.53476Z%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E';

const havePrevInstance = !!window.tonkeeper;

const provider = new TonProvider(window?.tonkeeper?.provider);
const tonconnect = new ExtensionTonConnectInjectedBridge(provider);
const tonapi = new TonApi(provider);

const linksInterceptor = new TonLinksInterceptor(provider, tonconnect);
linksInterceptor.startInterceptLinks();

window.tonkeeper = {
    provider,
    tonconnect
};
window.tonapi = tonapi;

// Injected EVM surface for multichain accounts. Reuses the TON transport
// (page→content→background); announced via EIP-6963 so it coexists with
// other injected wallets. Set as `window.ethereum` only when nothing else
// claims it, to avoid clobbering the user's other EVM wallet.
const evm = new TonkeeperEvmProvider(provider);
announceEvmProvider(evm, KEEPER_ICON);

const ethereumHolder = window as unknown as { ethereum?: unknown };
if (!ethereumHolder.ethereum) {
    ethereumHolder.ethereum = evm;
}

if (!havePrevInstance) {
    window.dispatchEvent(new Event('tonready'));
}
