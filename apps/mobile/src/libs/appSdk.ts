// eslint-disable-next-line max-classes-per-file
import {
    BaseApp,
    CookieService,
    IAppSdk,
    InternetConnectionService,
    NotificationService,
    BiometryService,
    ConfirmOptions,
    KeyboardService,
    AppCountryInfo
} from '@tonkeeper/core/dist/AppSdk';
import packageJson from '../../package.json';
import { CapacitorStorage } from './storage';
import { Clipboard } from '@capacitor/clipboard';
import { Biometric } from './plugins';
import { CapacitorCookies } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import { atom, Subject } from '@tonkeeper/core/dist/entries/atom';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { KeychainCapacitor } from './keychain';
import { Dialog } from '@capacitor/dialog';
import { Keyboard } from '@capacitor/keyboard';
import { isValidUrlProtocol, safeWindowOpen } from '@tonkeeper/core/dist/utils/common';
import { CAPACITOR_APPLICATION_ID } from './aplication-id';
import { CapacitorFileLogger } from './logger';
import { CapacitorDappBrowser } from './plugins/dapp-browser-plugin';
import { UserIdentityService } from '@tonkeeper/core/dist/user-identity';
import { IosSubscriptionStrategy } from './plugins/subscription-plugin';
import { CountryInfo } from './plugins/country-info-plugin';
import { SubscriptionService } from '@tonkeeper/core/SubscriptionService';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';

async function waitAppIsActive(): Promise<void> {
    return new Promise(async r => {
        const state = await App.getState();
        if (state.isActive) {
            r();
        } else {
            const unsubscribe = App.addListener('appStateChange', ({ isActive }) => {
                if (isActive) {
                    unsubscribe.then(v => v.remove());
                    setTimeout(r);
                }
            });
        }
    });
}

export class CookieCapacitor implements CookieService {
    cleanUp = async () => {
        await CapacitorCookies.clearAllCookies();
    };
}

export class BiometryServiceCapacitor implements BiometryService {
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
export const capacitorStorage = new CapacitorStorage();

export class CapacitorAppSdk extends BaseApp implements IAppSdk {
    cookie = new CookieCapacitor();

    /**
     * initialises in the App component when config is fetched
     */
    notifications: NotificationService | undefined = undefined;

    biometry = new BiometryServiceCapacitor(this.topMessage.bind(this));

    keychain = new KeychainCapacitor(this.biometry, this.storage);

    subscriptionService = new SubscriptionService(this.storage, {
        initialStrategyMap: new Map([[SubscriptionSource.IOS, new IosSubscriptionStrategy()]])
    });

    constructor() {
        super(capacitorStorage);
    }

    pasteFromClipboard = async () => {
        const { value } = await Clipboard.read();

        if (value || value === '') {
            return value;
        } else {
            throw new Error('Paste from Clipboard failed!');
        }
    };

    copyToClipboard = async (value: string, notification?: string) => {
        await Clipboard.write({ string: value });
        await this.hapticNotification('success');
        this.topMessage(notification);
    };

    openPage = async (
        url: string,
        options?: {
            forceExternalBrowser?: boolean;
        }
    ) => {
        try {
            if (!isValidUrlProtocol(url, this.authorizedOpenUrlProtocols)) {
                throw new Error('Unacceptable url protocol');
            }

            if (!url.startsWith('https://') && !url.startsWith('http://')) {
                try {
                    /* way to open in deeplinks on ios */

                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    window.location = url as any;
                } catch (e) {
                    console.error(e);
                }
            } else {
                if (options?.forceExternalBrowser) {
                    safeWindowOpen(url, this.authorizedOpenUrlProtocols);
                } else {
                    await Browser.open({ url });
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    authorizedOpenUrlProtocols = [
        'http:',
        'https:',
        'tg:',
        'tonsign:',
        'tonsign:',
        'tonkeeper:',
        'tonkeeperx:',
        'tonkeeper-mob:',
        'tonkeeper-tc-mob:',
        'mailto:'
    ];

    async confirm(options: ConfirmOptions) {
        const { value } = await Dialog.confirm(options);
        return value;
    }

    version = packageJson.version ?? 'Unknown';

    targetEnv = CAPACITOR_APPLICATION_ID;

    hapticNotification = async (type: 'success' | 'error' | 'impact_medium' | 'impact_light') => {
        await waitAppIsActive();
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

    signerReturnUrl = 'tonkeeper-pro://';

    keyboard = new CapacitorKeyboardService();

    logger = new CapacitorFileLogger('logs.txt');

    dappBrowser = CapacitorDappBrowser;

    userIdentity = new CapacitorUserIdentityService(capacitorStorage);

    async getAppCountryInfo(): Promise<AppCountryInfo> {
        return CountryInfo.getInfo();
    }
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

class CapacitorKeyboardService implements KeyboardService {
    public didShow = new Subject<{ keyboardHeight: number }>();

    public willShow = new Subject<{ keyboardHeight: number }>();

    public didHide = new Subject<void>();

    public willHide = new Subject<void>();

    constructor() {
        Keyboard.addListener('keyboardWillShow', info => this.willShow.next(info));
        Keyboard.addListener('keyboardDidShow', info => this.didShow.next(info));
        Keyboard.addListener('keyboardWillHide', () => this.willHide.next());
        Keyboard.addListener('keyboardDidHide', () => this.didHide.next());
    }
}

export class CapacitorUserIdentityService extends UserIdentityService {
    async getFirebaseUserId(): Promise<string> {
        const device = await Device.getId();
        return device.identifier;
    }
}
