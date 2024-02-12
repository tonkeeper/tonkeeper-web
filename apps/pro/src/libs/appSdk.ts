import { BaseApp, IAppSdk, KeychainPassword } from '@tonkeeper/core/dist/AppSdk';
import copyToClipboard from 'copy-to-clipboard';
import packageJson from '../../package.json';
import { sendBackground } from './backgroudService';
import { disableScroll, enableScroll, getScrollbarWidth } from './scroll';
import { DesktopStorage } from './storage';

export class KeychainDesktop implements KeychainPassword {
    setPassword = async (publicKey: string, mnemonic: string) => {
        return sendBackground<void>({ king: 'set-keychain', publicKey, mnemonic });
    };
    getPassword = async (publicKey: string) => {
        return sendBackground<string>({ king: 'get-keychain', publicKey });
    };
}

export class DesktopAppSdk extends BaseApp implements IAppSdk {
    keychain = new KeychainDesktop();

    constructor() {
        super(new DesktopStorage());
    }

    copyToClipboard = (value: string, notification?: string) => {
        copyToClipboard(value);

        this.topMessage(notification);
    };

    openPage = async (url: string) => {
        return sendBackground<void>({ king: 'open-page', url });
    };

    disableScroll = disableScroll;
    enableScroll = enableScroll;
    getScrollbarWidth = getScrollbarWidth;

    version = packageJson.version ?? 'Unknown';
}
