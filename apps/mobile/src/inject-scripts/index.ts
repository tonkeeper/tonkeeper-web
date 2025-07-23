import './global.d.ts';
import type { ITonConnectInjectedBridge } from '@tonkeeper/core/dist/entries/tonConnect';
import { MobileInjectedBridge } from './ton-connect';
import { setupHistoryNotifier } from './history-notifier';
import { TgAuthBridge } from './tg-auth-bridge';

declare global {
    interface Window {
        tonkeeper: {
            tonconnect: ITonConnectInjectedBridge;
            tgAuth: TgAuthBridge;
        };
    }
}

window.tonkeeper = {
    tonconnect: new MobileInjectedBridge(),
    tgAuth: new TgAuthBridge()
};

setupHistoryNotifier();

console.log('Tonkeeper Pro inject script loaded');
