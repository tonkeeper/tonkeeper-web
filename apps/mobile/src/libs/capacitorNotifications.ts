import { NotificationService } from '@tonkeeper/core/dist/AppSdk';
import { TonContract } from '@tonkeeper/core/dist/entries/wallet';
import { PushNotifications, Token } from '@capacitor/push-notifications';
import { TonendpointConfig } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { Device } from '@capacitor/device';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import { AppKey } from '@tonkeeper/core/dist/Keys';

const requestPushPermission = async () => {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
        throw new Error('Push notifications permission not granted');
    }

    const p = new Promise<string>((res, rej) => {
        PushNotifications.addListener('registration', (token: Token) => {
            if (!token.value) {
                rej(new Error('Push notifications permission not granted'));
                return;
            }
            res(token.value);
            PushNotifications.removeAllListeners();
        });

        PushNotifications.addListener('registrationError', (error: any) => {
            rej(error);
            PushNotifications.removeAllListeners();
        });

        setTimeout(() => {
            rej(new Error('Push notifications permission timeout'));
            PushNotifications.removeAllListeners();
        }, 10000);
    });

    await PushNotifications.register();

    return p;
};

const removeLastSlash = (url: string) => url.replace(/\/$/, '');

export class CapacitorNotifications implements NotificationService {
    private readonly baseUrl: string;

    constructor(config: TonendpointConfig, private readonly storage: IStorage) {
        this.baseUrl = removeLastSlash(config.tonapiIOEndpoint!);
    }

    async subscribe(
        _: APIConfig,
        wallet: TonContract,
        __: (bufferToSign: Buffer) => Promise<Buffer | Uint8Array>
    ) {
        const token = await requestPushPermission();

        const endpoint = `${this.baseUrl}/v1/internal/pushes/plain/subscribe`;
        const deviceId = await Device.getId();

        const result = await (
            await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    locale: (await Device.getLanguageCode()).value,
                    device: deviceId.identifier,
                    accounts: [{ address: wallet.rawAddress }],
                    token
                })
            })
        ).json();

        if (!result.ok) {
            throw new Error('Subscribe failed due to API error');
        }

        const records = await this.getRecords();
        records[wallet.rawAddress] = true;
        await this.storage.set(AppKey.NOTIFICATIONS, records);
    }

    async unsubscribe(address?: string) {
        const deviceId = await Device.getId();
        const endpoint = `${this.baseUrl}/v1/internal/pushes/plain/unsubscribe`;

        const result = await (
            await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    device: deviceId.identifier,
                    accounts: address ? [{ address }] : undefined
                })
            })
        ).json();

        if (!result.ok) {
            throw new Error('Unsubscribe failed due to API error');
        }

        let records = await this.getRecords();
        if (address) {
            records[address] = false;
        } else {
            records = {};
        }

        await PushNotifications.unregister();
        await this.storage.set(AppKey.NOTIFICATIONS, records);
    }

    async subscribeTonConnect() {
        // TODO
    }

    async unsubscribeTonConnect() {
        // TODO
    }

    async subscribed(address: string) {
        const records = await this.getRecords();
        return records[address] ?? false;
    }

    private async getRecords() {
        return (await this.storage.get<Record<string, boolean>>(AppKey.NOTIFICATIONS)) ?? {};
    }
}
