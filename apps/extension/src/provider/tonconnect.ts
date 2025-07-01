import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import {
    appRequestSchema,
    ConnectEvent,
    ConnectEventError,
    DisconnectEvent,
    type ITonConnectInjectedBridge,
    RpcMethod,
    TonConnectEventPayload,
    sendRequestPayloadSchema,
    protocolVersionSchema,
    WalletResponse,
    connectRequestSchema,
    WalletEvent
} from "@tonkeeper/core/dist/entries/tonConnect";
import { TonProvider } from '../provider/index';
import {
    getDeviceInfo,
    tonConnectTonkeeperAppName,
    tonConnectTonkeeperWalletInfo
} from "@tonkeeper/core/dist/service/tonConnect/connectService";
import packageJson from '../../package.json';
import { tonConnectProtocolVersion } from "../constants";

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

type TonConnectCallback = (event: WalletEvent) => void;


export class ExtensionTonConnectInjectedBridge implements ITonConnectInjectedBridge {
    #callbacks: TonConnectCallback[] = [];

    walletInfo = tonConnectTonkeeperWalletInfo;

    deviceInfo = getDeviceInfo('browser', packageJson.version,255, tonConnectTonkeeperAppName);

    protocolVersion = tonConnectProtocolVersion;

    isWalletBrowser = false;

    constructor(private provider: TonProvider) {
    }

    connect = async (_protocolVersion: unknown, _message: unknown): Promise<ConnectEvent> => {
        const { data: protocolVersion } = protocolVersionSchema.safeParse(_protocolVersion);

        if (protocolVersion === undefined || protocolVersion > this.protocolVersion) {
            return this.notify(
              formatConnectEventError(new TonConnectError('Unsupported protocol version', 1))
            );
        }
        try {
            const message = connectRequestSchema.parse(_message);
            const payload = await this.provider.send<TonConnectEventPayload>(
              'tonConnect_connect',
              message
            );

            return this.notify({
                event: 'connect',
                id: Date.now(),
                payload: payload
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
            const payload = await this.provider.send<TonConnectEventPayload>(
              'tonConnect_reconnect',
              [{ name: 'ton_addr' }]
            );

            return this.notify({
                event: 'connect',
                id: Date.now(),
                payload: payload
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

    async send<T extends RpcMethod>(message: unknown): Promise<WalletResponse<T>> {
        try {
            const {method, params: paramsRaw, id} = appRequestSchema.parse(message);
            const params = sendRequestPayloadSchema.parse(
              JSON.parse(paramsRaw[0]!)
            );

            const result = await this.provider.send<string>(
              `tonConnect_${method}`,
              params
            );
            return {
                result,
                id: String(id)
            };
        } catch (e) {
            const fallbackId = typeof message === 'object' && message && 'id' in message ? message.id : Date.now();
            if (e instanceof TonConnectError) {
                return {
                    error: e,
                    id: String(fallbackId)
                };
            } else {
                return {
                    error: new TonConnectError((e as Error).message ?? 'Unknown error'),
                    id: String(fallbackId)
                };
            }
        }
    };

    listen = (callback: (event: WalletEvent) => void): (() => void) => {
        this.#callbacks.push(callback);
        const callbacks = this.#callbacks;
        return () => {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    };

    notify = <E extends WalletEvent>(event: E): E => {
        this.#callbacks.forEach(item => item(event));
        return event;
    };
}
