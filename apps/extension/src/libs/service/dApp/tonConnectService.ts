import {
    CONNECT_EVENT_ERROR_CODES,
    ConnectRequest,
    TonConnectAccount,
    TonConnectEventPayload,
    TonConnectTransactionPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
    getDappConnection,
    tonDisconnectRequest,
    tonReConnectRequest
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { delay } from '@tonkeeper/core/dist/utils/common';
import { ExtensionStorage } from '../../storage';
import memoryStore from '../../store/memoryStore';
import { closeOpenedPopUp, getActiveTabLogo, openNotificationPopUp } from './notificationService';
import { waitApprove } from './utils';
import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import browser from 'webextension-polyfill';

const storage = new ExtensionStorage();

export const tonConnectReConnect = async (origin: string) => {
    const { version } = browser.runtime.getManifest();
    return await tonReConnectRequest(storage, version, origin);
};

export const tonConnectDisconnect = async (id: number, webViewUrl: string) =>
    tonDisconnectRequest({ storage, webViewUrl });

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
    const { version } = browser.runtime.getManifest();
    const reconnect = await tonReConnectRequest(storage, version, origin).catch(() => null);
    if (reconnect) {
        return reconnect;
    } else {
        return connectWithNotification(id, origin, data, logo);
    }
};

export const isDappConnectedToExtension = async (origin: string): Promise<boolean> => {
    const connection = await getDappConnection(storage, origin);
    return !!connection;
};

export const tonConnectTransaction = async (
    id: number,
    origin: string,
    data: TonConnectTransactionPayload,
    account: TonConnectAccount | undefined
) => {
    const connection = await getDappConnection(storage, origin, account);

    if (!connection) {
        throw new TonConnectError(
            "dApp don't have an access to wallet",
            CONNECT_EVENT_ERROR_CODES.BAD_REQUEST_ERROR
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
        kind: 'tonConnectSend',
        id,
        logo: await getActiveTabLogo(),
        origin,
        data
    });

    try {
        const popupId = await openNotificationPopUp();
        const result = await waitApprove<string>(id, popupId);
        return result;
    } finally {
        memoryStore.removeNotification(id);
    }
};
