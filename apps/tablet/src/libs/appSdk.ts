import {
    BaseApp,
    IAppSdk,
    KeychainPassword,
    TouchId,
    CookieService
} from '@tonkeeper/core/dist/AppSdk';
import packageJson from '../../package.json';
import { TabletStorage } from './storage';
import { Preferences } from '@capacitor/preferences';
import { Clipboard } from '@capacitor/clipboard';
import { getWindow } from "./utils";

export class KeychainTablet implements KeychainPassword { // TODO use secure storage
    setPassword = async (publicKey: string, mnemonic: string) => {
        await Preferences.set({
            key: `keychain-${publicKey}`,
            value: mnemonic
        });
    };

    getPassword = async (publicKey: string) => {
        const { value } = await Preferences.get({
            key: `keychain-${publicKey}`
        });
        return value!; // TODO
    };
}

export class CookieTablet implements CookieService {
    cleanUp = async () => {
        // TODO
    };
}

export class TouchIdTablet implements TouchId {
    canPrompt = async () => {
        return false; // TODO
    };

    // @ts-ignore
    prompt = async (reason: (lang: string) => string) => {
        // TODO
    };
}

export class TabletAppSdk extends BaseApp implements IAppSdk {
    keychain = new KeychainTablet();
    cookie = new CookieTablet();

    touchId = new TouchIdTablet();

    constructor() {
        super(new TabletStorage());
    }

    copyToClipboard = async (value: string, notification?: string) => {
        await Clipboard.write({ string: value });
        this.topMessage(notification);
    };

    openPage = async (url: string) => {
        getWindow()?.open(url, '_blank');
    };

    version = packageJson.version ?? 'Unknown';

    targetEnv = 'desktop' as const;
}
