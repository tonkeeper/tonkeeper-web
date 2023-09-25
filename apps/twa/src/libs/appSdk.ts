import { BaseApp, NativeBackButton } from '@tonkeeper/core/dist/AppSdk';
import { InitResult } from '@twa.js/sdk';
import copyToClipboard from 'copy-to-clipboard';
import packageJson from '../../package.json';
import { disableScroll, enableScroll, getScrollbarWidth } from './scroll';
import { TwaStorage } from './storage';

export class TwaAppSdk extends BaseApp {
    nativeBackButton: NativeBackButton;

    constructor(private components: InitResult) {
        super(new TwaStorage(components.cloudStorage));

        this.nativeBackButton = components.backButton;
    }

    copyToClipboard = (value: string, notification?: string) => {
        copyToClipboard(value);

        this.topMessage(notification);
        this.components.haptic.notificationOccurred('success');
    };

    openPage = async (url: string) => {
        if (url.includes('t.me')) {
            this.components.webApp.openTelegramLink(url);
        } else {
            this.components.webApp.openLink(url);
        }
    };

    confirm = async (text: string) => window.confirm(text);
    alert = async (text: string) => window.alert(text);

    twaExpand = () => this.components.viewport.expand();

    hapticNotification = (type: 'success' | 'error') => {
        this.components.haptic.notificationOccurred(type);
    };

    disableScroll = disableScroll;
    enableScroll = enableScroll;
    getScrollbarWidth = getScrollbarWidth;
    getKeyboardHeight = () => 0;

    isIOs = () => true;
    isStandalone = () => false;

    version = packageJson.version ?? 'Unknown';
}
