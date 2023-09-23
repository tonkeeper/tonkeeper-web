import {
    ConnectEvent,
    DisconnectEvent,
    KeyPair,
    RpcMethod,
    WalletResponse
} from '../../entries/tonConnect';
import { SessionCrypto } from './protocol';

const defaultBridgeUrl = 'https://bridge.tonapi.io/bridge';
const defaultTtl = 300;

export const sendEventToBridge = async <T extends RpcMethod>({
    response,
    sessionKeyPair,
    clientSessionId,
    ttl = defaultTtl,
    bridgeUrl = defaultBridgeUrl
}: {
    response: WalletResponse<T> | ConnectEvent | DisconnectEvent;
    sessionKeyPair: KeyPair;
    clientSessionId: string;
    ttl?: number;
    bridgeUrl?: string;
}) => {
    const sessionCrypto = new SessionCrypto(sessionKeyPair);
    const url = `${bridgeUrl}/message?client_id=${sessionCrypto.sessionId}&to=${clientSessionId}&ttl=${ttl}`;

    const encodedResponse = sessionCrypto.encrypt(
        JSON.stringify(response),
        new Uint8Array(Buffer.from(clientSessionId, 'hex'))
    );

    await fetch(url, {
        body: Buffer.from(encodedResponse).toString('base64'),
        method: 'POST'
    });
};
