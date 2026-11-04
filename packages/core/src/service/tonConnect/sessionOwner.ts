import { WalletId } from '../../entries/wallet';
import { AccountConnection } from './connectionService';

/**
 * The wallet an http-bridge session belongs to. A session id stored under
 * more than one wallet has no single owner and resolves to none — the dApp
 * has to connect again.
 */
export const walletIdOfClientSession = (
    walletsConnections: { wallet: { id: WalletId }; connections: AccountConnection[] }[],
    clientSessionId: string
): WalletId | undefined => {
    const owners = walletsConnections.filter(({ connections }) =>
        connections.some(c => c.type === 'http' && c.clientSessionId === clientSessionId)
    );
    return owners.length === 1 ? owners[0].wallet.id : undefined;
};
