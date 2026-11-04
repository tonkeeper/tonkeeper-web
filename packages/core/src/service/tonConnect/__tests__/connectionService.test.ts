/* eslint-disable import/no-extraneous-dependencies */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppKey } from '../../../Keys';
import { Network } from '../../../entries/network';
import type { IStorage } from '../../../Storage';
import { TonContract, WalletVersion } from '../../../entries/wallet';
import type { AccountConnectionHttp, AccountConnectionInjected } from '../connectionService';

const mocks = vi.hoisted(() => ({
    getAccounts: vi.fn()
}));

vi.mock('../../accountsStorage', () => ({
    accountsStorage: () => ({
        getAccounts: mocks.getAccounts
    })
}));

vi.mock('../../devStorage', () => ({
    getDevSettings: async () => ({ tonNetwork: Network.MAINNET })
}));

const {
    getTonWalletConnections,
    saveAccountConnection,
    disconnectHttpAccountConnection,
    disconnectInjectedAccountConnection
} = await import('../connectionService');

const PUBLIC_KEY = 'public-key';
const publicKeyEntry = `${AppKey.CONNECTIONS}_${PUBLIC_KEY}_${Network.MAINNET}`;
const walletEntry = (id: string) => `${AppKey.CONNECTIONS}_${id}_${Network.MAINNET}`;

const connection: AccountConnectionHttp = {
    id: 'https://example.com/manifest.json',
    type: 'http',
    manifest: {
        url: 'https://example.com',
        name: 'Example',
        iconUrl: 'https://example.com/icon.png'
    },
    sessionKeyPair: { publicKey: 'pub', secretKey: 'sec' },
    clientSessionId: 'session-1',
    connectItems: [{ name: 'ton_addr' }]
};

const memoryStorage = (initial: Record<string, unknown>) => {
    const data = new Map(Object.entries(initial));
    const storage = {
        get: async (key: string) => (data.has(key) ? data.get(key) : null),
        set: async (key: string, value: unknown) => {
            data.set(key, value);
            return value;
        },
        delete: async (key: string) => {
            const value = data.get(key) ?? null;
            data.delete(key);
            return value;
        },
        clear: async () => data.clear()
    } as unknown as IStorage;
    return { storage, data };
};

const accountWithWallets = (...ids: string[]) => ({
    allTonWallets: ids.map(id => ({ id, publicKey: PUBLIC_KEY, version: WalletVersion.V4R2 }))
});

describe('getTonWalletConnections public-key entry', () => {
    beforeEach(() => {
        mocks.getAccounts.mockReset();
    });

    it('moves to the wallet id when exactly one wallet has the key', async () => {
        mocks.getAccounts.mockResolvedValue([accountWithWallets('wallet-v4')]);
        const { storage, data } = memoryStorage({ [publicKeyEntry]: [connection] });

        const result = await getTonWalletConnections(storage, {
            id: 'wallet-v4',
            publicKey: PUBLIC_KEY
        });

        expect(result).toEqual([connection]);
        expect(data.get(walletEntry('wallet-v4'))).toEqual([connection]);
        expect(data.has(publicKeyEntry)).toBe(false);
    });

    it('is dropped when several wallets share the key', async () => {
        mocks.getAccounts.mockResolvedValue([accountWithWallets('wallet-v4', 'wallet-w5')]);
        const { storage, data } = memoryStorage({ [publicKeyEntry]: [connection] });

        const first = await getTonWalletConnections(storage, {
            id: 'wallet-v4',
            publicKey: PUBLIC_KEY
        });
        const second = await getTonWalletConnections(storage, {
            id: 'wallet-w5',
            publicKey: PUBLIC_KEY
        });

        expect(first).toEqual([]);
        expect(second).toEqual([]);
        expect(data.get(walletEntry('wallet-v4'))).toEqual([]);
        expect(data.get(walletEntry('wallet-w5'))).toEqual([]);
        expect(data.has(publicKeyEntry)).toBe(false);
    });

    it('is not copied to a second wallet after it moved', async () => {
        mocks.getAccounts.mockResolvedValue([accountWithWallets('wallet-v4')]);
        const { storage } = memoryStorage({ [publicKeyEntry]: [connection] });

        await getTonWalletConnections(storage, { id: 'wallet-v4', publicKey: PUBLIC_KEY });

        mocks.getAccounts.mockResolvedValue([accountWithWallets('wallet-v4', 'wallet-w5')]);
        const other = await getTonWalletConnections(storage, {
            id: 'wallet-w5',
            publicKey: PUBLIC_KEY
        });

        expect(other).toEqual([]);
    });
});

const wallet = { id: 'wallet-v4' } as TonContract;

const injectedConnection: AccountConnectionInjected = {
    id: 'https://other.com',
    type: 'injected',
    manifest: {
        url: 'https://other.com',
        name: 'Other',
        iconUrl: 'https://other.com/icon.png'
    },
    webViewOrigin: 'https://other.com',
    creationTimestamp: 1,
    connectItems: [{ name: 'ton_addr' }]
};

const saveHttp = (storage: IStorage, clientSessionId: string) =>
    saveAccountConnection({
        storage,
        wallet,
        manifest: connection.manifest,
        params: {
            type: 'http',
            sessionKeyPair: connection.sessionKeyPair,
            clientSessionId,
            request: { items: [{ name: 'ton_addr' }] }
        }
    });

describe('http sessions of one dApp', () => {
    it('are kept side by side', async () => {
        const { storage } = memoryStorage({ [walletEntry(wallet.id)]: [] });

        await saveHttp(storage, 'browser-a');
        await saveHttp(storage, 'browser-b');

        const result = await getTonWalletConnections(storage, wallet);
        expect(result.map(c => c.type === 'http' && c.clientSessionId)).toEqual([
            'browser-b',
            'browser-a'
        ]);
    });

    it('replace only the same session', async () => {
        const { storage } = memoryStorage({ [walletEntry(wallet.id)]: [] });

        await saveHttp(storage, 'browser-a');
        await saveHttp(storage, 'browser-a');

        expect(await getTonWalletConnections(storage, wallet)).toHaveLength(1);
    });

    it('disconnect one at a time and leave injected connections', async () => {
        const { storage } = memoryStorage({
            [walletEntry(wallet.id)]: [
                { ...connection, clientSessionId: 'browser-a' },
                { ...connection, clientSessionId: 'browser-b' },
                injectedConnection
            ]
        });

        await disconnectHttpAccountConnection({ storage, wallet, clientSessionId: 'browser-a' });

        expect(await getTonWalletConnections(storage, wallet)).toEqual([
            { ...connection, clientSessionId: 'browser-b' },
            injectedConnection
        ]);
    });

    it('survive an injected disconnect', async () => {
        const { storage } = memoryStorage({
            [walletEntry(wallet.id)]: [connection, injectedConnection]
        });

        await disconnectInjectedAccountConnection({
            storage,
            wallet,
            webViewUrl: injectedConnection.webViewOrigin
        });

        expect(await getTonWalletConnections(storage, wallet)).toEqual([connection]);
    });
});
