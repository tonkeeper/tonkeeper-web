import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import {
    AppRequest,
    ConnectEvent,
    ConnectEventError,
    ConnectRequest, DeviceInfo,
    DisconnectEvent, RpcMethod,
    TonConnectEventPayload,
    WalletResponseSuccess
} from "@tonkeeper/core/dist/entries/tonConnect";
import { TonProvider } from '../provider/index';
import { getExtensionDeviceInfo } from "../libs/service/dApp/tonConnectService";
import { TonConnectInjectedBridge, ITonConnectInternalProvider } from "@tonkeeper/core/dist/entries/injectedTonConnectBridge";
import { tonConnectTonkeeperWalletInfo } from "@tonkeeper/core/dist/service/tonConnect/connectService";
import { ReadonlySubject, subject } from "@tonkeeper/core/dist/entries/atom";

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

export type WalletEvent = ConnectEvent | DisconnectEvent;


class TonConnectInternalProvider implements ITonConnectInternalProvider {
    events = subject<WalletEvent>();

    constructor(private provider: TonProvider) {
        provider.on('tonConnect_event', params => {
            this.events.next({
                event: params.event,
                id: params.id ?? Date.now(),
                payload: params.payload
            });
        });
    }

    connect(message: ConnectRequest): Promise<TonConnectEventPayload> {
        return  this.provider.send<TonConnectEventPayload>(
          'tonConnect_connect',
          message
        );
    }

    reConnect(): Promise<TonConnectEventPayload> {
        return  this.provider.send<TonConnectEventPayload>(
          'tonConnect_reconnect',
          [{ name: 'ton_addr' }]
        );
    }

    request<T extends RpcMethod>(message: AppRequest<T>): Promise<WalletResponseSuccess<T>["result"]> {
        const payload = Array.isArray(message.params)
          ? message.params.map(item => JSON.parse(item))
          : JSON.parse(message.params);

        return this.provider.send<string>(
          `tonConnect_${message.method}`,
          payload
        );
    }
}

export class TonConnect extends TonConnectInjectedBridge {
    deviceInfo = {} as DeviceInfo;

    walletInfo = tonConnectTonkeeperWalletInfo;

    isWalletBrowser = false;

    constructor(provider: TonProvider) {
        super(new TonConnectInternalProvider(provider));
        getExtensionDeviceInfo().then(v => this.deviceInfo = v);
    }
}
