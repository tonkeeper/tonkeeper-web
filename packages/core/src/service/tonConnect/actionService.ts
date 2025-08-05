import { TonConnectAppRequest } from '../../entries/tonConnect';
import { disconnectResponse, sendBadRequestResponse } from './connectService';
import { sendEventToBridge } from './httpBridge';

export const replyHttpBadRequestResponse = async ({
    connection,
    request: { id, method },
    bridgeEndpoint
}: TonConnectAppRequest<'http'> & { bridgeEndpoint: string | undefined }) => {
    await sendEventToBridge({
        response: sendBadRequestResponse(id, method),
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
    bridgeEndpoint: string | undefined;
}) => {
    await sendEventToBridge({
        response: disconnectResponse(id),
        sessionKeyPair: connection.sessionKeyPair,
        clientSessionId: connection.clientSessionId,
        bridgeEndpoint
    });
};
