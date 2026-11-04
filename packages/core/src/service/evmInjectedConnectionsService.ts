import { AppKey } from '../Keys';
import { IStorage } from '../Storage';

/**
 * A settled injected-EVM (window.ethereum) connection for one dApp origin,
 * written by the extension when the user approves eth_requestAccounts.
 * `address` is the connected account's EVM address; `chainId` is the
 * hex-encoded EIP-155 chain the dApp currently sees. `name` and `icon`
 * come from the dApp's tab at approval time and may be absent on records
 * written before they were captured.
 */
export interface EvmInjectedConnection {
    accountId: string;
    address: string;
    chainId: string;
    name?: string;
    icon?: string;
    connectedAt?: number;
}

export const getEvmInjectedConnections = async (
    storage: IStorage
): Promise<Record<string, EvmInjectedConnection>> =>
    (await storage.get<Record<string, EvmInjectedConnection>>(AppKey.EVM_INJECTED_CONNECTIONS)) ??
    {};

export const setEvmInjectedConnection = async (
    storage: IStorage,
    origin: string,
    connection: EvmInjectedConnection
): Promise<void> => {
    const all = await getEvmInjectedConnections(storage);
    all[origin] = connection;
    await storage.set(AppKey.EVM_INJECTED_CONNECTIONS, all);
};

/** Returns whether a connection for the origin existed and was removed. */
export const removeEvmInjectedConnection = async (
    storage: IStorage,
    origin: string
): Promise<boolean> => {
    const all = await getEvmInjectedConnections(storage);
    if (!(origin in all)) {
        return false;
    }
    delete all[origin];
    await storage.set(AppKey.EVM_INJECTED_CONNECTIONS, all);
    return true;
};
