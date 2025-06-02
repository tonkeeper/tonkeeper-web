import { TonConnectAppRequest } from '../../entries/tonConnect';
import { disconnectResponse, sendBadRequestResponse } from './connectService';
import { sendEventToBridge } from './httpBridge';

export const replyHttpBadRequestResponse = async ({
    connection,
    request: { id, method }
}: TonConnectAppRequest<'http'>) => {
    await sendEventToBridge({
        response: sendBadRequestResponse(id, method),
        sessionKeyPair: connection.sessionKeyPair,
        clientSessionId: connection.clientSessionId
    });
};

export const replyHttpDisconnectResponse = async ({
    connection,
    request: { id }
}: Pick<TonConnectAppRequest<'http'>, 'connection'> & {
    request: Pick<TonConnectAppRequest<'http'>['request'], 'id'>;
}) => {
    await sendEventToBridge({
        response: disconnectResponse(id),
        sessionKeyPair: connection.sessionKeyPair,
        clientSessionId: connection.clientSessionId
    });
};
