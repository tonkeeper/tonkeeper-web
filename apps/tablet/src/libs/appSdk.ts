import {
    BaseApp,
    IAppSdk,
    KeychainPassword,
    TouchId,
    CookieService, NotificationService
} from "@tonkeeper/core/dist/AppSdk";
import packageJson from '../../package.json';
import { TabletStorage } from './storage';
import { Clipboard } from '@capacitor/clipboard';
import { getWindow } from './utils';
import { Biometric, SecureStorage } from "./plugins";
import { CapacitorCookies } from "@capacitor/core";
import { Device } from '@capacitor/device';

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
        await CapacitorCookies.clearAllCookies();
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
        return Biometric.prompt(reason('en'));
    };
}

export const TABLET_APPLICATION_ID = 'tablet' as const;

export class TabletAppSdk extends BaseApp implements IAppSdk {
    keychain = new KeychainTablet();
    cookie = new CookieTablet();
    /**
     * initialises in the App component when config is fetched
     */
    notifications: NotificationService | undefined = undefined;

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

    targetEnv = TABLET_APPLICATION_ID;
}

export const getTabletOS = async ()=> {
    const info = await Device.getInfo();
    return info.platform;
}
