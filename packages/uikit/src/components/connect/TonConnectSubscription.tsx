import { useMutation, useQuery } from '@tanstack/react-query';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import {
    TonConnectAppRequest,
    TonConnectTransactionPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
    disconnectResponse,
    sendBadRequestResponse,
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
import React, { useCallback, useEffect, useState } from 'react';
import { useSendNotificationAnalytics } from '../../hooks/amplitude';
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
    return useMutation<void, Error, TonConnectAppRequest>(
        async ({ connection, request: { id } }) => {
            await disconnectAppConnection({
                storage: sdk.storage,
                wallet,
                clientSessionId: connection.clientSessionId
            });
            await sendEventToBridge({
                response: disconnectResponse(id),
                sessionKeyPair: connection.sessionKeyPair,
                clientSessionId: connection.clientSessionId
            });
        }
    );
};

const useUnSupportMethodMutation = () => {
    return useMutation<void, Error, TonConnectAppRequest>(
        async ({ connection, request: { id, method } }) => {
            await sendEventToBridge({
                response: sendBadRequestResponse(id, method),
                sessionKeyPair: connection.sessionKeyPair,
                clientSessionId: connection.clientSessionId
            });
        }
    );
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

    const { mutate: disconnect } = useDisconnectMutation(sdk);
    const { mutate: badRequestResponse } = useUnSupportMethodMutation();
    const { mutateAsync: responseSendAsync } = responseSendMutation();

    useSendNotificationAnalytics(request?.connection?.manifest);

    useEffect(() => {
        const handleMessage = (params: TonConnectAppRequest) => {
            switch (params.request.method) {
                case 'disconnect': {
                    return disconnect(params);
                }
                case 'sendTransaction': {
                    setRequest(undefined);
                    const value = {
                        connection: params.connection,
                        id: params.request.id,
                        payload: JSON.parse(params.request.params[0])
                    };
                    setTimeout(() => {
                        setRequest(value);
                    }, 100);
                    return;
                }
                default: {
                    return badRequestResponse(params);
                }
            }
        };

        const close = subscribeTonConnect({
            sdk,
            handleMessage,
            connections: data?.connections,
            lastEventId: data?.lastEventId
        });

        return () => {
            close();
        };
    }, [sdk, data, disconnect, setRequest, badRequestResponse]);

    const handleClose = useCallback(
        async (boc?: string) => {
            if (!request) return;
            try {
                await responseSendAsync({ request, boc });
            } finally {
                setRequest(undefined);
            }
        },
        [request, responseSendAsync, setRequest]
    );

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
