import {
    EvmInjectedConnection,
    getEvmInjectedConnections,
    removeEvmInjectedConnection,
    setEvmInjectedConnection
} from '@tonkeeper/core/dist/service/evmInjectedConnectionsService';
import {
    WALLET_CONNECT_NETWORKS,
    evmHexChainIdOf
} from '@tonkeeper/core/dist/service/walletConnect/wcChains';
import { DAppPageMeta } from '../../../entries/message';
import { ExtensionStorage } from '../../storage';
import { customPopupManager } from '../../background/custom-popup-manager';
import { showNotificationInPopup } from '../backgroundPopUpService';
import { awaitPopupResponse } from './utils';
import { backgroundEventsEmitter } from '../../event';
import ExtensionPlatform from '../extension';

const storage = new ExtensionStorage();

/** Push an EIP-1193 event to a dApp origin (delivered by subscriptionDAppNotifications). */
const emitEvmEvent = (origin: string, name: string, data: unknown): void => {
    backgroundEventsEmitter.emit('evmEvent', {
        method: 'evmEvent',
        params: { origins: [origin], name, data }
    });
};

/** The popup's connect-approval payload: the connection minus the dApp metadata. */
type EvmConnectionApproval = Pick<EvmInjectedConnection, 'accountId' | 'address' | 'chainId'>;

/** EIP-1193 error. `code` follows EIP-1193 / JSON-RPC (4001 user-rejected, 4100 unauthorized, …). */
class EvmRpcError extends Error {
    constructor(message: string, readonly code: number) {
        super(message);
    }
}

const SUPPORTED_CHAIN_IDS = new Set(WALLET_CONNECT_NETWORKS.map(evmHexChainIdOf));
const DEFAULT_CHAIN_ID = evmHexChainIdOf('eth');

const removeConnection = async (origin: string): Promise<void> => {
    if (await removeEvmInjectedConnection(storage, origin)) {
        emitEvmEvent(origin, 'accountsChanged', []);
    }
};

const connectionOf = async (origin: string): Promise<EvmInjectedConnection | undefined> =>
    (await getEvmInjectedConnections(storage))[origin];

const requireConnection = async (origin: string): Promise<EvmInjectedConnection> => {
    const connection = await connectionOf(origin);
    if (!connection) {
        throw new EvmRpcError('The dApp is not connected to the wallet', 4100);
    }
    return connection;
};

export const isEvmMethod = (method: string): boolean =>
    method.startsWith('eth_') ||
    method.startsWith('personal_') ||
    method.startsWith('wallet_') ||
    method.startsWith('net_');

/**
 * eth_requestAccounts — return the already-connected address, otherwise open
 * the popup for the user to approve a connection and persist it. `pageMeta`
 * (title/favicon read from the dApp's DOM) identifies the dApp in the
 * connect prompt and the connected-apps list; the active tab is the
 * fallback, though without the `tabs` permission its title and favicon
 * are usually unavailable.
 */
const requestAccounts = async (
    id: number,
    origin: string,
    pageMeta?: DAppPageMeta
): Promise<string[]> => {
    const existing = await connectionOf(origin);
    if (existing) {
        return [existing.address];
    }

    const tab = await ExtensionPlatform.getActiveTab();
    const name = pageMeta?.title ?? tab?.title;
    const icon = pageMeta?.icon ?? tab?.favIconUrl;

    const closePopup = await customPopupManager.openPopup();
    showNotificationInPopup({
        kind: 'evmConnectRequest',
        id,
        origin,
        logo: icon ?? '',
        data: { chainId: DEFAULT_CHAIN_ID }
    });

    try {
        const approved = await awaitPopupResponse<EvmConnectionApproval>(id);
        await setEvmInjectedConnection(storage, origin, {
            ...approved,
            name,
            icon,
            connectedAt: Date.now()
        });
        return [approved.address];
    } finally {
        closePopup();
    }
};

/**
 * A signing / transaction method — require a live connection, then open the
 * popup, which decodes the request, has the user confirm, signs with the
 * account that approved the connection, and returns the signature or
 * transaction hash.
 */
const signRequest = async (
    id: number,
    origin: string,
    method: string,
    params: unknown[]
): Promise<string> => {
    const connection = await requireConnection(origin);

    const closePopup = await customPopupManager.openPopup();
    showNotificationInPopup({
        kind: 'evmSignRequest',
        id,
        origin,
        logo: await ExtensionPlatform.getActiveTabLogo(),
        data: {
            method,
            params,
            chainId: connection.chainId,
            address: connection.address,
            accountId: connection.accountId
        }
    });

    try {
        return await awaitPopupResponse<string>(id);
    } finally {
        closePopup();
    }
};

/** wallet_switchEthereumChain — accept only chains the wallet supports. */
const switchChain = async (origin: string, params: unknown[]): Promise<null> => {
    const target = (params[0] as { chainId?: string } | undefined)?.chainId;
    if (!target || !SUPPORTED_CHAIN_IDS.has(target.toLowerCase())) {
        throw new EvmRpcError('Unsupported chain', 4902);
    }
    const connection = await connectionOf(origin);
    if (connection) {
        await setEvmInjectedConnection(storage, origin, {
            ...connection,
            chainId: target.toLowerCase()
        });
        emitEvmEvent(origin, 'chainChanged', target.toLowerCase());
    }
    return null;
};

const SIGNING_METHODS = new Set([
    'personal_sign',
    'eth_sign',
    'eth_signTypedData',
    'eth_signTypedData_v4',
    'eth_signTransaction',
    'eth_sendTransaction'
]);

/**
 * Handle an injected-EVM JSON-RPC request from a dApp. Read methods answer from
 * stored connection state; connect and signing methods open the popup.
 */
export const handleEvmRequest = async (
    id: number,
    origin: string,
    method: string,
    params: unknown[],
    pageMeta?: DAppPageMeta
): Promise<unknown> => {
    switch (method) {
        case 'eth_requestAccounts':
            return requestAccounts(id, origin, pageMeta);
        case 'eth_accounts': {
            const connection = await connectionOf(origin);
            return connection ? [connection.address] : [];
        }
        case 'eth_chainId':
        case 'net_version': {
            const connection = await connectionOf(origin);
            const chainId = connection?.chainId ?? DEFAULT_CHAIN_ID;
            return method === 'net_version' ? String(parseInt(chainId, 16)) : chainId;
        }
        case 'wallet_switchEthereumChain':
            return switchChain(origin, params);
        case 'wallet_revokePermissions':
            await removeConnection(origin);
            return null;
        default:
            if (SIGNING_METHODS.has(method)) {
                return signRequest(id, origin, method, params);
            }
            throw new EvmRpcError(`Method "${method}" is not supported`, 4200);
    }
};

/**
 * Notify a dApp that its injected-EVM connection was revoked wallet-side.
 * The popup removes the stored connection itself (it shares the extension
 * storage), so the background only pushes `accountsChanged`.
 */
export const evmNotifyDisconnected = (origin: string): void =>
    emitEvmEvent(origin, 'accountsChanged', []);
