import {
    BaseApp,
    IAppSdk,
    KeychainPassword,
    TouchId,
    CookieService
} from '@tonkeeper/core/dist/AppSdk';
import packageJson from '../../package.json';
import { TabletStorage } from './storage';
import { Clipboard } from '@capacitor/clipboard';
import { getWindow } from './utils';
import { Biometric, SecureStorage } from "./plugins";

export class KeychainTablet implements KeychainPassword {
    setPassword = async (publicKey: string, mnemonic: string) => {
        await SecureStorage.storeData({
            id: `Wallet-${publicKey}`,
            data: mnemonic
        });
    };

    getPassword = async (publicKey: string) => {
        const { data } = await SecureStorage.getData({
            id: `Wallet-${publicKey}`
        });
        return data!;
    };
}

export class CookieTablet implements CookieService {
    cleanUp = async () => {
        // TODO
    };
}

export class TouchIdTablet implements TouchId {
    canPrompt = async () => {
        try {
            const result = await Biometric.canPrompt();
            return result.isAvailable;
        } catch (e) {
            console.error('TOUCH ID rejected, cause', e);
            return  false;
        }
    };

    prompt = async (reason: (lang: string) => string) => {
        return Biometric.prompt(reason('en')); // TODO lang
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
