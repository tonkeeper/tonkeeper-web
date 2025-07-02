import './global.d.ts';
import type { ITonConnectInjectedBridge } from '@tonkeeper/core/dist/entries/tonConnect';
import { MobileInjectedBridge } from './ton-connect';
import { setupHistoryNotifier } from './history-notifier';

declare global {
    interface Window {
        tonkeeper: {
            tonconnect: ITonConnectInjectedBridge;
        };
    }
}

window.tonkeeper = {
    tonconnect: new MobileInjectedBridge()
};

setupHistoryNotifier();

console.log('Tonkeeper Pro inject script loaded');
