import { BaseApp, NativeBackButton, NotificationService } from '@tonkeeper/core/dist/AppSdk';
import { delay } from '@tonkeeper/core/dist/utils/common';
import { InitResult } from '@twa.js/sdk';
import copyToClipboard from 'copy-to-clipboard';
import packageJson from '../../package.json';
import { disableScroll, enableScroll, getScrollbarWidth } from './scroll';
import { TwaStorage } from './storage';

class TwaNotification implements NotificationService {
    constructor(private components: InitResult) {}
    subscribe = async (wallet: string, mnemonic: string[]) => {
        console.log(this.components.initDataRaw);
        await delay(1000);
    };
    unsubscribe = async (wallet: string, mnemonic: string[]) => {
        console.log(this.components.initDataRaw);
        await delay(1000);
    };

    subscribeTonConnect = async (sessionKey: string) => {
        console.log(this.components.initDataRaw);
        await delay(1000);
    };
    unsubscribeTonConnect = async (sessionKey: string) => {
        console.log(this.components.initDataRaw);
        await delay(1000);
    };
}

export class TwaAppSdk extends BaseApp {
    nativeBackButton: NativeBackButton;
    notifications: NotificationService;

    constructor(private components: InitResult) {
        super(new TwaStorage(components.cloudStorage));

        this.notifications = new TwaNotification(components);
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
