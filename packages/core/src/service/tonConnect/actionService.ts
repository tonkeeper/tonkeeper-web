import { TonConnectAppRequest } from '../../entries/tonConnect';
import { disconnectResponse, sendBadRequestResponse } from './connectService';
import { sendEventToBridge } from './httpBridge';

export const replyHttpBadRequestResponse = async ({
    connection,
    request: { id, method },
    message,
    bridgeEndpoint
}: Pick<TonConnectAppRequest<'http'>, 'connection'> & {
    request: Pick<TonConnectAppRequest<'http'>['request'], 'id' | 'method'>;
    message?: string;
    bridgeEndpoint: string;
}) => {
    await sendEventToBridge({
        response: sendBadRequestResponse(id, method, message),
        sessionKeyPair: connection.sessionKeyPair,
        clientSessionId: connection.clientSessionId,
        bridgeEndpoint
    });
};

export const replyHttpDisconnectResponse = async ({
    connection,
    request: { id },
    bridgeEndpoint
}: Pick<TonConnectAppRequest<'http'>, 'connection'> & {
    request: Pick<TonConnectAppRequest<'http'>['request'], 'id'>;
    bridgeEndpoint: string;
}) => {
    await sendEventToBridge({
        response: disconnectResponse(id),
        sessionKeyPair: connection.sessionKeyPair,
        clientSessionId: connection.clientSessionId,
        bridgeEndpoint
    });
};
