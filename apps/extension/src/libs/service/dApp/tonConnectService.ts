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
import { popupManager } from '../../background/popup-manager';
import ExtensionPlatform from '../extension';
import { showNotificationInPopup } from '../backgroundPopUpService';

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
            return '' as unknown as DeviceInfo['platform'];
    }
};

const tonReConnectResponse = async (origin: string): Promise<TonConnectEventPayload> => {
    const { items, maxMessages } = await tonInjectedReConnectRequest(storage, origin);

    return {
        items,
        device: await getExtensionDeviceInfo({ maxMessages })
    };
};

export async function getExtensionDeviceInfo(options?: {
    maxMessages?: number;
}): Promise<DeviceInfo> {
    const { version } = browser.runtime.getManifest();
    const { os } = await browser.runtime.getPlatformInfo();
    return getDeviceInfo(
        getTonConnectPlatform(os),
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
    const closedPopupHandle = await popupManager.openPopup();
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

    const closedPopupHandle = await popupManager.openPopup();
    showNotificationInPopup({
        kind: 'tonConnectSend',
        id,
        logo: await ExtensionPlatform.getActiveTabLogo(),
        origin,
        data,
        manifest: connection.connection.manifest
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

    const closedPopupHandle = await popupManager.openPopup();
    showNotificationInPopup({
        kind: 'tonConnectSign',
        id,
        logo: await ExtensionPlatform.getActiveTabLogo(),
        origin,
        data,
        manifest: connection.connection.manifest
    });

    try {
        return await awaitPopupResponse<string>(id);
    } finally {
        await closedPopupHandle();
    }
};
