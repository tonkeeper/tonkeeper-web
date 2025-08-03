import copyToClipboard from 'copy-to-clipboard';
import { BaseApp } from '@tonkeeper/core/dist/AppSdk';
import { safeWindowOpen } from '@tonkeeper/core/dist/utils/common';

import { BrowserStorage } from './storage';
import packageJson from '../../package.json';
import { disableScroll, enableScroll, getScrollbarWidth } from './scroll';
import { Subscription } from '@tonkeeper/core/CryptoSubscriptionStrategy';

function iOS() {
    return (
        ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(
            navigator.platform
        ) ||
        // iPad on iOS 13 detection
        (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    );
}

export class BrowserAppSdk extends BaseApp {
    constructor() {
        super(new BrowserStorage());
    }

    pasteFromClipboard = async () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
            try {
                return await navigator.clipboard.readText();
            } catch (e) {
                console.error('Failed to read clipboard', e);
                return '';
            }
        } else {
            return '';
        }
    };

    copyToClipboard = (value: string, notification?: string) => {
        copyToClipboard(value);

        this.topMessage(notification);
    };
    openPage = async (url: string) => {
        safeWindowOpen(url, this.authorizedOpenUrlProtocols);
    };

    disableScroll = disableScroll;
    enableScroll = enableScroll;
    getScrollbarWidth = getScrollbarWidth;
    getKeyboardHeight = () => 0;

    isIOs = iOS;
    isStandalone = () => iOS() && ((window.navigator as any).standalone as boolean);

    version = packageJson.version ?? 'Unknown';

    targetEnv = 'web' as const;

    signerReturnUrl = 'https://wallet.tonkeeper.com/';

    authorizedOpenUrlProtocols = ['http:', 'https:', 'tg:', 'mailto:', 'tonsign:'];

    subscriptionStrategy = Subscription;
}
