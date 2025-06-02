import type { ITonConnectInjectedBridge } from '@tonkeeper/core/dist/entries/tonConnect';
import { MobileInjectedBridge } from './ton-connect';

declare global {
    interface Window {
        tonkeeper: {
            tonconnect: ITonConnectInjectedBridge;
        };
    }
}

window.tonkeeper.tonconnect = new MobileInjectedBridge();
