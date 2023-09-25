import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import { EventEmitter } from '@tonkeeper/core/dist/entries/eventEmitter';
import { InitResult } from '@twa.js/sdk';
import copyToClipboard from 'copy-to-clipboard';
import packageJson from '../../package.json';
import { disableScroll, enableScroll, getScrollbarWidth } from './scroll';

export class TwaAppSdk implements IAppSdk {
    constructor(public storage: IStorage, private components: InitResult) {}
    copyToClipboard = (value: string, notification?: string) => {
        copyToClipboard(value);
        this.uiEvents.emit('copy', {
            method: 'copy',
            params: notification
        });

        this.components.haptic.notificationOccurred('success');
    };
    openPage = async (url: string) => {
        window.open(url, '_black');
    };

    confirm = async (text: string) => window.confirm(text);
    alert = async (text: string) => window.alert(text);
    requestExtensionPermission = async () => void 0;

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

    uiEvents = new EventEmitter();
    version = packageJson.version ?? 'Unknown';
}
