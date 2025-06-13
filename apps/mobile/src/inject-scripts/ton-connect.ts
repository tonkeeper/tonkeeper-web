import type {
    AppRequest,
    ConnectEvent,
    ConnectRequest,
    DeviceInfo,
    ITonConnectInjectedBridge,
    RpcMethod,
    WalletEvent,
    WalletResponse
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
    getBrowserPlatform,
    getDeviceInfo,
    tonConnectTonkeeperProAppName,
    tonConnectTonkeeperProWalletInfo
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import packageJson from '../../package.json';
import { bridgeEvents$, postBridgeMessage } from './native-bridge';
import { NATIVE_BRIDGE_METHODS } from './native-bridge-methods';

function currentDeviceInfo(options?: { maxMessages?: number }): DeviceInfo {
    return getDeviceInfo(
        getBrowserPlatform(),
        packageJson.version,
        options?.maxMessages ?? 255,
        tonConnectTonkeeperProAppName
    );
}

export class MobileInjectedBridge implements ITonConnectInjectedBridge {
    protocolVersion = 2;

    walletInfo = tonConnectTonkeeperProWalletInfo;

    deviceInfo = currentDeviceInfo();

    isWalletBrowser = true;

    connect(protocolVersion: number, message: ConnectRequest): Promise<ConnectEvent> {
        return postBridgeMessage<ConnectEvent>({
            method: NATIVE_BRIDGE_METHODS.TON_CONNECT.CONNECT,
            params: {
                protocolVersion,
                message
            }
        });
    }

    restoreConnection(): Promise<ConnectEvent> {
        return postBridgeMessage<ConnectEvent>({
            method: NATIVE_BRIDGE_METHODS.TON_CONNECT.RESTORE_CONNECTION
        });
    }

    send<T extends RpcMethod>(message: AppRequest<T>): Promise<WalletResponse<T>> {
        return postBridgeMessage<WalletResponse<T>>({
            method: NATIVE_BRIDGE_METHODS.TON_CONNECT.SEND,
            params: {
                message
            }
        });
    }

    listen(callback: (event: WalletEvent) => void): () => void {
        return bridgeEvents$.subscribe(event => callback(event as WalletEvent));
    }
}
