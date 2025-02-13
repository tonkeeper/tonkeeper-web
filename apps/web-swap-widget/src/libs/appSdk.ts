import { BaseApp } from '@tonkeeper/core/dist/AppSdk';
import copyToClipboard from 'copy-to-clipboard';
import packageJson from '../../package.json';
import { disableScroll, enableScroll, getScrollbarWidth } from './scroll';
import { SwapWidgetStorage } from './storage';

function iOS() {
    return (
        ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(
            navigator.platform
        ) ||
        // iPad on iOS 13 detection
        (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    );
}

export class WidgetAppSdk extends BaseApp {
    static version = packageJson.version ?? 'Unknown';

    constructor() {
        super(new SwapWidgetStorage());
    }

    copyToClipboard = (value: string, notification?: string) => {
        copyToClipboard(value);

        this.topMessage(notification);
    };

    openPage = async (url: string) => {
        window.open(url, '_black', 'noreferrer,noopener');
    };

    disableScroll = disableScroll;

    enableScroll = enableScroll;

    getScrollbarWidth = getScrollbarWidth;

    getKeyboardHeight = () => 0;

    isIOs = iOS;

    isStandalone = () =>
        iOS() && ((window.navigator as unknown as { standalone: boolean }).standalone as boolean);

    version = WidgetAppSdk.version;

    targetEnv = 'web' as const;
}
