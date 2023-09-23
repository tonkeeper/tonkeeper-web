import { useMutation, useQuery } from '@tanstack/react-query';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import {
    TonConnectAppRequest,
    TonConnectTransactionPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
    disconnectResponse,
    sendTransactionErrorResponse,
    sendTransactionSuccessResponse
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import {
    AccountConnection,
    disconnectAppConnection,
    getAccountConnection
} from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import {
    getLastEventId,
    sendEventToBridge,
    subscribeTonConnect
} from '@tonkeeper/core/dist/service/tonConnect/httpBridge';
import React, { useEffect, useState } from 'react';
import { useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { QueryKey } from '../../libs/queryKey';
import { TonTransactionNotification } from './TonTransactionNotification';

const useConnections = (sdk: IAppSdk) => {
    const wallet = useWalletContext();
    return useQuery([wallet.publicKey, QueryKey.connection], async () => {
        const lastEventId = await getLastEventId(sdk.storage);
        const connections = await getAccountConnection(sdk.storage, wallet);
        return { lastEventId, connections };
    });
};

const useDisconnectMutation = (sdk: IAppSdk) => {
    const wallet = useWalletContext();
    return useMutation(async ({ clientSessionId, id }: { clientSessionId: string; id: string }) => {
        const disconnect = await disconnectAppConnection({
            storage: sdk.storage,
            wallet,
            clientSessionId
        });
        if (disconnect) {
            await sendEventToBridge({
                response: disconnectResponse(id),
                sessionKeyPair: disconnect.sessionKeyPair,
                clientSessionId
            });
        }
    });
};

interface ResponseSendProps {
    request: SendTransactionAppRequest;
    boc?: string;
}
const responseSendMutation = () => {
    return useMutation<undefined, Error, ResponseSendProps>(
        async ({ request: { connection, id }, boc }) => {
            const response = boc
                ? sendTransactionSuccessResponse(id, boc)
                : sendTransactionErrorResponse(id);

            await sendEventToBridge({
                response,
                sessionKeyPair: connection.sessionKeyPair,
                clientSessionId: connection.clientSessionId
            });

            return undefined;
        }
    );
};

interface SendTransactionAppRequest {
    id: string;
    connection: AccountConnection;
    payload: TonConnectTransactionPayload;
}

const TonConnectSubscription = () => {
    const [request, setRequest] = useState<SendTransactionAppRequest | undefined>(undefined);

    const sdk = useAppSdk();
    const { data } = useConnections(sdk);

    const { mutate } = useDisconnectMutation(sdk);

    const { mutateAsync: responseSendAsync } = responseSendMutation();
    useEffect(() => {
        const close = subscribeTonConnect({
            sdk,
            connections: data?.connections,
            lastEventId: data?.lastEventId
        });

        return () => {
            close();
        };
    }, [sdk, data]);

    useEffect(() => {
        const handler = ({ params }: { method: 'tonConnect'; params: TonConnectAppRequest }) => {
            console.log(params);
            switch (params.request.method) {
                case 'disconnect': {
                    return mutate({
                        clientSessionId: params.connection.clientSessionId,
                        id: params.request.id
                    });
                }
                case 'sendTransaction': {
                    return setRequest({
                        connection: params.connection,
                        id: params.request.id,
                        payload: JSON.parse(params.request.params[0])
                    });
                }
                case 'signData': {
                    return; // TODO: UNDONE, is it really need to someone?
                }
            }
        };
        sdk.uiEvents.on('tonConnect', handler);
        return () => {
            sdk.uiEvents.off('tonConnect', handler);
        };
    }, [sdk, data]);

    const handleClose = async (boc?: string) => {
        if (!request) return;
        try {
            await responseSendAsync({ request, boc });
        } finally {
            setRequest(undefined);
        }
    };

    return (
        <>
            <TonTransactionNotification
                params={request?.payload ?? null}
                handleClose={handleClose}
            />
        </>
    );
};

export default TonConnectSubscription;
