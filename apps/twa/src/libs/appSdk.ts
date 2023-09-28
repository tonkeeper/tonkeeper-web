import { BaseApp, NativeBackButton, NotificationService } from '@tonkeeper/core/dist/AppSdk';
import {
    toTonProofItem,
    tonConnectProofPayload
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { InitResult } from '@twa.js/sdk';
import copyToClipboard from 'copy-to-clipboard';
import packageJson from '../../package.json';
import { Configuration, DefaultApi } from '../twaApi';
import { disableScroll, enableScroll, getScrollbarWidth } from './scroll';
import { TwaStorage } from './storage';

const apiConfig = new Configuration({ basePath: 'https://twa-api-dev.tonkeeper.com' });
const twaApi = new DefaultApi(apiConfig);

class TwaNotification implements NotificationService {
    constructor(private components: InitResult) {}

    get twaInitData() {
        const { initDataRaw } = this.components;
        if (!initDataRaw) {
            throw new Error('missing twa init data');
        }
        return Buffer.from(initDataRaw, 'utf8').toString('base64');
    }

    private getTonConnectProof = async (address: string, mnemonic: string[]) => {
        const domain = 'https://twa.tonkeeper.com/';
        const { payload } = await twaApi.getTonConnectPayload();
        const proofPayload = tonConnectProofPayload(domain, address, payload);
        return await toTonProofItem(mnemonic, proofPayload);
    };

    subscribe = async (address: string, mnemonic: string[]) => {
        try {
            await this.components.webApp.requestWriteAccess();
        } catch (e) {
            console.error(e);
        }

        const proof = await this.getTonConnectProof(address, mnemonic);
        await twaApi.subscribeToAccountEvents({
            subscribeToAccountEventsRequest: {
                twaInitData: this.twaInitData,
                address,
                proof
            }
        });
    };

    unsubscribe = async (address?: string) => {
        await twaApi.unsubscribeFromAccountEvents({
            unsubscribeFromAccountEventsRequest: {
                twaInitData: this.twaInitData
            }
        });
    };

    subscribeTonConnect = async (clientId: string, origin: string) => {
        await twaApi.subscribeToBridgeEvents({
            subscribeToBridgeEventsRequest: {
                twaInitData: this.twaInitData,
                clientId,
                origin
            }
        });
    };

    unsubscribeTonConnect = async (clientId?: string) => {
        await twaApi.unsubscribeFromBridgeEvents({
            unsubscribeFromBridgeEventsRequest: {
                twaInitData: this.twaInitData,
                clientId
            }
        });
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
