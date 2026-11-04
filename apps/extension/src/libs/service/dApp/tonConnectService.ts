import {
    CONNECT_EVENT_ERROR_CODES,
    ConnectRequest,
    DeviceInfo,
    SIGN_DATA_ERROR_CODES,
    SignDataRequestPayload,
    TonConnectAccount,
    TonConnectEventPayload,
    TonConnectNetwork,
    TonConnectTransactionPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
    checkTonConnectFromAndNetwork,
    getDeviceInfo,
    getInjectedDappConnection,
    getTonConnectPlatform,
    tonConnectTonkeeperAppName,
    tonInjectedDisconnectRequest,
    tonInjectedReConnectRequest
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { delay } from '@tonkeeper/core/dist/utils/common';
import { ExtensionStorage } from '../../storage';
import { awaitPopupResponse } from './utils';
import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import browser from 'webextension-polyfill';
import { customPopupManager } from '../../background/custom-popup-manager';
import ExtensionPlatform from '../extension';
import { showNotificationInPopup } from '../backgroundPopUpService';

const storage = new ExtensionStorage();

const tonReConnectResponse = async (origin: string): Promise<TonConnectEventPayload> => {
    const { items, maxMessages } = await tonInjectedReConnectRequest(storage, origin);

    return {
        items,
        device: getExtensionDeviceInfo({ maxMessages })
    };
};

export function getExtensionDeviceInfo(options?: { maxMessages?: number }): DeviceInfo {
    const { version } = browser.runtime.getManifest();
    return getDeviceInfo(
        getTonConnectPlatform('extension'),
        version,
        options?.maxMessages ?? 255,
        tonConnectTonkeeperAppName
    );
}

export const tonConnectReConnect = async (origin: string) => {
    return tonReConnectResponse(origin);
};

export const tonConnectDisconnect = async (_: number, webViewUrl: string) =>
    tonInjectedDisconnectRequest({ storage, webViewUrl });

const connectWithNotification = async (
    id: number,
    origin: string,
    data: ConnectRequest,
    logo: string
): Promise<TonConnectEventPayload> => {
    const closedPopupHandle = await customPopupManager.openPopup();
    showNotificationInPopup({
        kind: 'tonConnectRequest',
        id,
        logo,
        origin,
        data
    });

    try {
        return await awaitPopupResponse<TonConnectEventPayload>(id);
    } finally {
        await closedPopupHandle();
    }
};

export const tonConnectRequest = async (
    id: number,
    origin: string,
    data: ConnectRequest
): Promise<TonConnectEventPayload> => {
    const logo = await ExtensionPlatform.getActiveTabLogo();
    const isTonProof = data.items.some(item => item.name === 'ton_proof');
    if (isTonProof) {
        return connectWithNotification(id, origin, data, logo);
    }
    const reconnect = await tonReConnectResponse(origin).catch(() => null);
    if (reconnect) {
        return reconnect;
    } else {
        return connectWithNotification(id, origin, data, logo);
    }
};

export const isDappConnectedToExtension = async (origin: string): Promise<boolean> => {
    const connection = await getInjectedDappConnection(storage, origin);
    return !!connection;
};

export const tonConnectTransaction = async (
    id: number,
    origin: string,
    data: TonConnectTransactionPayload,
    account: TonConnectAccount | undefined
) => {
    const connection = await getInjectedDappConnection(storage, origin);

    if (!connection) {
        throw new TonConnectError(
            "dApp don't have an access to wallet",
            CONNECT_EVENT_ERROR_CODES.BAD_REQUEST_ERROR
        );
    }

    if (account) {
        await checkTonConnectFromAndNetwork(storage, connection.wallet, {
            from: account.address,
            network: account.network as TonConnectNetwork
        });
    }
    await checkTonConnectFromAndNetwork(storage, connection.wallet, data);

    try {
        await accountsStorage(storage).setActiveAccountAndWalletByWalletId(connection.wallet.id);
    } catch (e) {
        console.error(e);
        throw new TonConnectError(
            'Requested wallet not found',
            CONNECT_EVENT_ERROR_CODES.BAD_REQUEST_ERROR
        );
    }

    await delay(200);

    const closedPopupHandle = await customPopupManager.openPopup();
    showNotificationInPopup({
        kind: 'tonConnectSend',
        id,
        logo: await ExtensionPlatform.getActiveTabLogo(),
        origin,
        data,
        manifest: connection.connection.manifest,
        walletId: connection.wallet.id
    });

    try {
        return await awaitPopupResponse<string>(id);
    } finally {
        await closedPopupHandle();
    }
};

export const tonConnectSignData = async (
    id: number,
    origin: string,
    data: SignDataRequestPayload
) => {
    const connection = await getInjectedDappConnection(storage, origin);

    if (!connection) {
        throw new TonConnectError(
            "dApp don't have an access to wallet",
            SIGN_DATA_ERROR_CODES.BAD_REQUEST_ERROR
        );
    }

    await checkTonConnectFromAndNetwork(storage, connection.wallet, data);

    try {
        await accountsStorage(storage).setActiveAccountAndWalletByWalletId(connection.wallet.id);
    } catch (e) {
        console.error(e);
        throw new TonConnectError(
            'Requested wallet not found',
            SIGN_DATA_ERROR_CODES.BAD_REQUEST_ERROR
        );
    }

    await delay(200);

    const closedPopupHandle = await customPopupManager.openPopup();
    showNotificationInPopup({
        kind: 'tonConnectSign',
        id,
        logo: await ExtensionPlatform.getActiveTabLogo(),
        origin,
        data,
        manifest: connection.connection.manifest,
        walletId: connection.wallet.id
    });

    try {
        return await awaitPopupResponse<string>(id);
    } finally {
        await closedPopupHandle();
    }
};
