import {
    BaseApp,
    CookieService,
    IAppSdk,
    InternetConnectionService,
    KeychainPassword,
    NotificationService,
    TouchId
} from '@tonkeeper/core/dist/AppSdk';
import packageJson from '../../package.json';
import { CapacitorStorage } from './storage';
import { Clipboard } from '@capacitor/clipboard';
import { Biometric, SecureStorage } from './plugins';
import { CapacitorCookies } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { Browser } from '@capacitor/browser';

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
    constructor(private alert: (text: string) => void) {}

    canPrompt = async () => {
        try {
            const result = await Biometric.canPrompt();
            return result.isAvailable;
        } catch (e) {
            console.error('TOUCH ID rejected, cause', e);
            return false;
        }
    };

    prompt = async (reason: (lang: string) => string) => {
        try {
            return await Biometric.prompt(reason('en'));
        } catch (e) {
            if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
                this.alert(e.message);
            }
            throw e;
        }
    };
}

export const CAPACITOR_APPLICATION_ID: 'mobile' | 'tablet' =
    window.innerWidth <= 550 ? 'mobile' : 'tablet';

export class CapacitorAppSdk extends BaseApp implements IAppSdk {
    keychain = new KeychainTablet();

    cookie = new CookieTablet();

    /**
     * initialises in the App component when config is fetched
     */
    notifications: NotificationService | undefined = undefined;

    touchId = new TouchIdTablet(this.topMessage.bind(this));

    constructor() {
        super(new CapacitorStorage());
    }

    copyToClipboard = async (value: string, notification?: string) => {
        await Clipboard.write({ string: value });
        await this.hapticNotification('success');
        this.topMessage(notification);
    };

    openPage = async (url: string) => {
        if (!url.startsWith('https://') && !url.startsWith('http://')) {
            try {
                /* way to open in deeplinks on ios */

                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                window.location = url as any;
            } catch (e) {
                console.error(e);
            }
        } else {
            await Browser.open({ url });
        }
    };

    version = packageJson.version ?? 'Unknown';

    targetEnv = CAPACITOR_APPLICATION_ID;

    hapticNotification = (type: 'success' | 'error' | 'impact_medium' | 'impact_light') => {
        if (type === 'impact_medium') {
            return Haptics.impact({ style: ImpactStyle.Medium });
        }

        if (type === 'impact_light') {
            return Haptics.impact({ style: ImpactStyle.Light });
        }

        return Haptics.notification({
            type: type === 'success' ? NotificationType.Success : NotificationType.Error
        });
    };

    connectionService = new CapacitorConnectionService();

    signerReturnUrl = 'tonkeeper://'; // TODO replace with 'tonkeeper-pro://'; once signer is fixed
}

export const getCapacitorDeviceOS = async () => {
    const info = await Device.getInfo();
    return info.platform;
};

class CapacitorConnectionService implements InternetConnectionService {
    isOnline = atom(true);

    constructor() {
        Network.getStatus().then(v => this.isOnline.next(v.connected));

        Network.addListener('networkStatusChange', status => {
            this.isOnline.next(status.connected);
        });
    }

    public async retry() {
        const status = await Network.getStatus();
        this.isOnline.next(status.connected);
        return status.connected;
    }
}
