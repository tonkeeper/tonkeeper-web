import { TonConnectError } from './exception';
import {
    ConnectEvent,
    ConnectEventError,
    ConnectRequest,
    DeviceInfo,
    TonConnectEventPayload,
    ITonConnectInjectedBridge,
    InjectedWalletInfo,
    WalletEvent,
    RpcMethod,
    AppRequest,
    WalletResponse,
    ConnectEventSuccess,
    WalletResponseSuccess
} from './tonConnect';
import { ReadonlySubject } from './atom';

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

export interface ITonConnectInternalProvider {
    events: ReadonlySubject<WalletEvent>;
    request<T extends RpcMethod>(
        message: AppRequest<T>
    ): Promise<WalletResponseSuccess<T>['result']>;
    connect(message: ConnectRequest): Promise<TonConnectEventPayload>;
    reConnect(): Promise<TonConnectEventPayload>;
}

export abstract class TonConnectInjectedBridge implements ITonConnectInjectedBridge {
    callbacks: Array<(event: WalletEvent) => void> = [];

    abstract deviceInfo: DeviceInfo;

    abstract walletInfo: InjectedWalletInfo;

    protocolVersion = 2;

    abstract isWalletBrowser: boolean;

    constructor(private provider: ITonConnectInternalProvider) {
        provider.events.subscribe(event => {
            this.notifyAndReturn(event);
        });
    }

    connect = async (protocolVersion: number, message: ConnectRequest): Promise<ConnectEvent> => {
        // TODO security check
        if (protocolVersion > this.protocolVersion) {
            return this.notifyAndReturn(
                formatConnectEventError(new TonConnectError('Unsupported protocol version', 1))
            );
        }
        try {
            const payload = await this.provider.connect(message);
            const event: ConnectEventSuccess = {
                event: 'connect',
                id: Date.now(),
                payload: payload
            };

            return this.notifyAndReturn(event);
        } catch (e) {
            if (e instanceof TonConnectError) {
                return this.notifyAndReturn(formatConnectEventError(e));
            } else {
                return this.notifyAndReturn(
                    formatConnectEventError(
                        new TonConnectError((e as Error).message ?? 'Unknown error')
                    )
                );
            }
        }
    };

    restoreConnection = async (): Promise<ConnectEvent> => {
        try {
            const payload = await this.provider.reConnect();

            const event: ConnectEventSuccess = {
                event: 'connect',
                id: Date.now(),
                payload: payload
            };

            return this.notifyAndReturn(event);
        } catch (e) {
            if (e instanceof TonConnectError) {
                return this.notifyAndReturn(formatConnectEventError(e));
            } else {
                return this.notifyAndReturn(
                    formatConnectEventError(
                        new TonConnectError((e as Error).message ?? 'Unknown error')
                    )
                );
            }
        }
    };

    send = async <T extends RpcMethod>(message: AppRequest<T>): Promise<WalletResponse<T>> => {
        try {
            // TODO security check
            const result = await this.provider.request(message);

            return {
                id: String(message.id),
                result
            } as WalletResponse<T>;
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

    notifyAndReturn = <E extends WalletEvent>(event: E): E => {
        this.callbacks.forEach(item => item(event));
        return event;
    };
}
