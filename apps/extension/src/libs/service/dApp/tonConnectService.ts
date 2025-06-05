import {
    CONNECT_EVENT_ERROR_CODES,
    ConnectRequest,
    DeviceInfo,
    SIGN_DATA_ERROR_CODES,
    SignDataRequestPayload,
    TonConnectAccount,
    TonConnectEventPayload,
    TonConnectTransactionPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
    getInjectedDappConnection,
    getDeviceInfo, tonConnectTonkeeperProAppName,
    tonInjectedDisconnectRequest,
    tonInjectedReConnectRequest, getInjectedDappConnectionForWallet
} from "@tonkeeper/core/dist/service/tonConnect/connectService";
import { delay } from '@tonkeeper/core/dist/utils/common';
import { ExtensionStorage } from '../../storage';
import memoryStore from '../../store/memoryStore';
import { closeOpenedPopUp, getActiveTabLogo, openNotificationPopUp } from './notificationService';
import { waitApprove } from './utils';
import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import browser from 'webextension-polyfill';

const storage = new ExtensionStorage();

const getTonConnectPlatform = (os: browser.Runtime.PlatformOs): DeviceInfo['platform'] => {
    switch (os) {
        case 'mac': {
            return 'mac';
        }
        case 'win': {
            return 'windows';
        }
        case 'android': {
            return 'android';
        }
        case 'cros':
        case 'linux':
        case 'openbsd': {
            return 'linux';
        }
        default:
            return '' as any as DeviceInfo['platform'];
    }
};

const tonReConnectResponse = async (origin: string): Promise<TonConnectEventPayload> => {
    const { items, maxMessages } = await tonInjectedReConnectRequest(storage, origin);

    return {
        items,
        device: await getExtensionDeviceInfo({ maxMessages })
    };
};

export async function getExtensionDeviceInfo(options?: { maxMessages?: number }): Promise<DeviceInfo> {
    const { version } = browser.runtime.getManifest();
    const { os } = await browser.runtime.getPlatformInfo();
    return getDeviceInfo(getTonConnectPlatform(os), version, options?.maxMessages ?? 255, tonConnectTonkeeperProAppName)
}

export const tonConnectReConnect = async (origin: string) => {
    return await tonReConnectResponse(origin);
};

export const tonConnectDisconnect = async (id: number, webViewUrl: string) =>
    tonInjectedDisconnectRequest({ storage, webViewUrl });

const cancelOpenedNotification = async () => {
    const notification = memoryStore.getNotification();
    if (notification) {
        await closeOpenedPopUp();
        memoryStore.removeNotification(notification.id);
        await delay(200); // wait resolving opened notification
    }
};

const connectWithNotification = async (
    id: number,
    origin: string,
    data: ConnectRequest,
    logo: string
): Promise<TonConnectEventPayload> => {
    await cancelOpenedNotification();
    memoryStore.addNotification({
        kind: 'tonConnectRequest',
        id,
        logo,
        origin,
        data
    });

    try {
        const popupId = await openNotificationPopUp();
        const result = await waitApprove<TonConnectEventPayload>(id, popupId);

        return result;
    } finally {
        memoryStore.removeNotification(id);
    }
};

export const tonConnectRequest = async (
    id: number,
    origin: string,
    data: ConnectRequest
): Promise<TonConnectEventPayload> => {
    const logo = await getActiveTabLogo();
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
    const connection = await getInjectedDappConnectionForWallet(storage, origin, account);

    if (!connection) {
        throw new TonConnectError(
            "dApp don't have an access to wallet",
            CONNECT_EVENT_ERROR_CODES.BAD_REQUEST_ERROR
        );
    }

    try {
        await accountsStorage(storage).setActiveAccountAndWalletByWalletId(connection.wallet.id);
    } catch (e) {
        console.error(e);
        throw new TonConnectError(
          "Requested wallet not found",
          CONNECT_EVENT_ERROR_CODES.BAD_REQUEST_ERROR
        );
    }

    await delay(200);

    await cancelOpenedNotification();
    memoryStore.addNotification({
        kind: 'tonConnectSend',
        id,
        logo: await getActiveTabLogo(),
        origin,
        data,
        manifest: connection.connection.manifest
    });

    try {
        const popupId = await openNotificationPopUp();
        const result = await waitApprove<string>(id, popupId);
        return result;
    } finally {
        memoryStore.removeNotification(id);
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

    const accounts = await accountsStorage(storage).getAccounts();
    const accToActivate = accounts.find(a =>
        a.allTonWallets.some(w => w.id === connection.wallet.rawAddress)
    );

    if (accToActivate) {
        accToActivate.setActiveTonWallet(connection.wallet.rawAddress);
        await accountsStorage(storage).updateAccountInState(accToActivate);
        await accountsStorage(storage).setActiveAccountId(accToActivate.id);
    }

    await delay(200);

    await cancelOpenedNotification();
    memoryStore.addNotification({
        kind: 'tonConnectSign',
        id,
        logo: await getActiveTabLogo(),
        origin,
        data,
        manifest: connection.connection.manifest
    });

    try {
        const popupId = await openNotificationPopUp();
        const result = await waitApprove<string>(id, popupId);
        return result;
    } finally {
        memoryStore.removeNotification(id);
    }
};
