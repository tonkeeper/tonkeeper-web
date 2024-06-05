import { TonConnectAppRequest } from '../../entries/tonConnect';
import { disconnectResponse, sendBadRequestResponse } from './connectService';
import { sendEventToBridge } from './httpBridge';

export const replyBadRequestResponse = async ({
    connection,
    request: { id, method }
}: TonConnectAppRequest) => {
    await sendEventToBridge({
        response: sendBadRequestResponse(id, method),
        sessionKeyPair: connection.sessionKeyPair,
        clientSessionId: connection.clientSessionId
    });
};

export const replyDisconnectResponse = async ({
    connection,
    request: { id }
}: Pick<TonConnectAppRequest, 'connection'> & {
    request: Pick<TonConnectAppRequest['request'], 'id'>;
}) => {
    await sendEventToBridge({
        response: disconnectResponse(id),
        sessionKeyPair: connection.sessionKeyPair,
        clientSessionId: connection.clientSessionId
    });
};
