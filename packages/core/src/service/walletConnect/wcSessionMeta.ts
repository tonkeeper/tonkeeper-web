import { AppKey } from '../../Keys';
import { IStorage } from '../../Storage';
import { AccountId } from '../../entries/account';

/**
 * Per-session bookkeeping the WalletConnect SDK doesn't hold: which
 * account approved the session, when, and through which entry point.
 * Keyed by session topic under `AppKey.WALLET_CONNECT_META`.
 */
export interface WalletConnectSessionMeta {
    accountId: AccountId;
    connectedAt: number;
    source: 'link' | 'paste' | 'scan';
}

type MetaMap = Record<string, WalletConnectSessionMeta>;

export const getWalletConnectSessionMetas = async (storage: IStorage): Promise<MetaMap> =>
    (await storage.get<MetaMap>(AppKey.WALLET_CONNECT_META)) ?? {};

export const setWalletConnectSessionMeta = async (
    storage: IStorage,
    topic: string,
    meta: WalletConnectSessionMeta
): Promise<void> => {
    const map = await getWalletConnectSessionMetas(storage);
    await storage.set(AppKey.WALLET_CONNECT_META, { ...map, [topic]: meta });
};

/** Drops metadata for topics that no longer have an active session. */
export const pruneWalletConnectSessionMetas = async (
    storage: IStorage,
    activeTopics: string[]
): Promise<void> => {
    const map = await getWalletConnectSessionMetas(storage);
    const active = new Set(activeTopics);
    const pruned = Object.fromEntries(Object.entries(map).filter(([topic]) => active.has(topic)));
    if (Object.keys(pruned).length !== Object.keys(map).length) {
        await storage.set(AppKey.WALLET_CONNECT_META, pruned);
    }
};
