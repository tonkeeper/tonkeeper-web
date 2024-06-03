import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import {
    ConnectEvent,
    ConnectEventError,
    ConnectItemReply,
    ConnectRequest,
    DeviceInfo,
    DisconnectEvent,
    SendTransactionRpcRequest,
    SendTransactionRpcResponse
} from '@tonkeeper/core/dist/entries/tonConnect';
import packageJson from '../../package.json';
import { TonProvider } from '../provider/index';

function getPlatform(): DeviceInfo['platform'] {
    const platform =
        (window.navigator as any)?.userAgentData?.platform || window.navigator.platform;

    const userAgent = window.navigator.userAgent;

    const macosPlatforms = ['macOS', 'Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    const iphonePlatforms = ['iPhone'];
    const iosPlatforms = ['iPad', 'iPod'];

    let os: DeviceInfo['platform'] | null = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'mac';
    } else if (iphonePlatforms.indexOf(platform) !== -1) {
        os = 'iphone';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'ipad';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'windows';
    } else if (/Android/.test(userAgent)) {
        os = 'linux';
    } else if (/Linux/.test(platform)) {
        os = 'linux';
    }

    return os!;
}

export const getDeviceInfo = (): DeviceInfo => {
    return {
        platform: getPlatform()!,
        appName: 'Tonkeeper',
        appVersion: packageJson.version,
        maxProtocolVersion: 2,
        features: [
            'SendTransaction',
            {
                name: 'SendTransaction',
                maxMessages: 4
            }
        ]
    };
};

const formatConnectEventError = (error: TonConnectError): ConnectEventError => {
    return {
        event: 'connect_error',
        id: Date.now(),
        payload: {
            code: error.code,
            message: error.message
        }
    };
};

export type TonConnectAppRequest = TonConnectSendTransactionRequest;

export interface TonConnectSendTransactionRequest {
    method: 'sendTransaction';
    params: [string, string]; // json string TonConnectTransactionPayload, json string TonConnectAccount
    return: 'back' | 'none' | string;
    id: number;
}

export type TonConnectWalletResponse = WalletResponseSuccess | WalletResponseError;

interface WalletResponseSuccess {
    result: string;
    id: string;
}

interface WalletResponseError {
    error: { code: number; message: string; data?: unknown };
    id: string;
}

export type WalletEvent = ConnectEvent | DisconnectEvent;

export interface WalletInfo {
    name: string;
    image: string;
    tondns?: string;
    about_url: string;
}

export interface TonConnectBridge {
    deviceInfo: DeviceInfo; // see Requests/Responses spec
    walletInfo?: WalletInfo;
    protocolVersion: number; // max supported Ton Connect version (e.g. 2)
    isWalletBrowser: boolean; // if the page is opened into wallet's browser
    connect(protocolVersion: number, message: ConnectRequest): Promise<ConnectEvent>;
    restoreConnection(): Promise<ConnectEvent>;
    send(message: SendTransactionRpcRequest): Promise<SendTransactionRpcResponse>;
    listen(callback: (event: WalletEvent) => void): () => void;
}

type TonConnectCallback = (event: WalletEvent) => void;

export class TonConnect implements TonConnectBridge {
    callbacks: TonConnectCallback[] = [];

    deviceInfo: DeviceInfo = getDeviceInfo();
    walletInfo: WalletInfo = {
        name: 'Tonkeeper',
        image: 'https://tonkeeper.com/assets/tonconnect-icon.png',
        tondns: 'tonkeeper.ton',
        about_url: 'https://tonkeeper.com'
    };

    protocolVersion = 2;
    isWalletBrowser = false;

    constructor(private provider: TonProvider, tonconnect?: TonConnect) {
        if (tonconnect) {
            this.callbacks = tonconnect.callbacks;
        } else {
            provider.on('chainChanged', () => {
                this.notify({
                    event: 'disconnect',
                    id: Date.now(),
                    payload: {}
                });
            });

            provider.on('tonConnect_event', params => {
                this.notify({
                    event: params.event,
                    id: params.id ?? Date.now(),
                    payload: params.payload
                });
            });
        }
    }

    connect = async (protocolVersion: number, message: ConnectRequest): Promise<ConnectEvent> => {
        if (protocolVersion > this.protocolVersion) {
            return this.notify(
                formatConnectEventError(new TonConnectError('Unsupported protocol version', 1))
            );
        }
        try {
            const items = await this.provider.send<ConnectItemReply[]>(
                'tonConnect_connect',
                message
            );

            return this.notify({
                event: 'connect',
                id: Date.now(),
                payload: {
                    items: items,
                    device: getDeviceInfo()
                }
            });
        } catch (e) {
            if (e instanceof TonConnectError) {
                return this.notify(formatConnectEventError(e));
            } else {
                return this.notify(
                    formatConnectEventError(
                        new TonConnectError((e as Error).message ?? 'Unknown error')
                    )
                );
            }
        }
    };

    disconnect = async () => {
        await this.provider.send(`tonConnect_disconnect`);
        return this.notify<DisconnectEvent>({
            event: 'disconnect',
            id: Date.now(),
            payload: {}
        });
    };

    restoreConnection = async (): Promise<ConnectEvent> => {
        try {
            const items = await this.provider.send<ConnectItemReply[]>('tonConnect_reconnect', [
                { name: 'ton_addr' }
            ]);

            return this.notify({
                event: 'connect',
                id: Date.now(),
                payload: {
                    items: items,
                    device: getDeviceInfo()
                }
            });
        } catch (e) {
            if (e instanceof TonConnectError) {
                return this.notify(formatConnectEventError(e));
            } else {
                return this.notify(
                    formatConnectEventError(
                        new TonConnectError((e as Error).message ?? 'Unknown error')
                    )
                );
            }
        }
    };

    send = async (message: SendTransactionRpcRequest): Promise<SendTransactionRpcResponse> => {
        try {
            const result = await this.provider.send<string>(
                `tonConnect_${message.method}`,
                message.params.map(item => JSON.parse(item))
            );
            return {
                result,
                id: String(message.id)
            };
        } catch (e) {
            if (e instanceof TonConnectError) {
                return {
                    error: e,
                    id: String(message.id)
                };
            } else {
                return {
                    error: new TonConnectError((e as Error).message ?? 'Unknown error'),
                    id: String(message.id)
                };
            }
        }
    };

    listen = (callback: (event: WalletEvent) => void): (() => void) => {
        this.callbacks.push(callback);
        const callbacks = this.callbacks;
        return () => {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    };

    notify = <E extends WalletEvent>(event: E): E => {
        this.callbacks.forEach(item => item(event));
        return event;
    };
}
