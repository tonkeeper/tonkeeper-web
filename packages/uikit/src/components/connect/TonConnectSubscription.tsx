import { useMutation, useQuery } from '@tanstack/react-query';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { TonConnectAppRequest } from '@tonkeeper/core/dist/entries/tonConnect';
import {
    replyBadRequestResponse,
    replyDisconnectResponse
} from '@tonkeeper/core/dist/service/tonConnect/actionService';
import {
    disconnectAppConnection,
    getAccountConnection
} from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import {
    getLastEventId,
    subscribeTonConnect
} from '@tonkeeper/core/dist/service/tonConnect/httpBridge';
import React, { useCallback, useEffect, useState } from 'react';
import { useSendNotificationAnalytics } from '../../hooks/amplitude';
import { useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { QueryKey } from '../../libs/queryKey';
import { TonTransactionNotification } from './TonTransactionNotification';
import { SendTransactionAppRequest, responseSendMutation } from './connectHook';

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
    return useMutation<void, Error, TonConnectAppRequest>(async ({ connection, request }) => {
        await disconnectAppConnection({
            storage: sdk.storage,
            wallet,
            clientSessionId: connection.clientSessionId
        });
        await replyDisconnectResponse({ connection, request });

        if (sdk.notifications) {
            try {
                await sdk.notifications.unsubscribeTonConnect(connection.clientSessionId);
            } catch (e) {
                if (e instanceof Error) sdk.topMessage(e.message);
            }
        }
    });
};

const useUnSupportMethodMutation = () => {
    return useMutation<void, Error, TonConnectAppRequest>(replyBadRequestResponse);
};

const TonConnectSubscription = () => {
    const [request, setRequest] = useState<SendTransactionAppRequest | undefined>(undefined);

    const sdk = useAppSdk();
    const wallet = useWalletContext();
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

        const { notifications } = sdk;
        (async () => {
            if (notifications && data) {
                try {
                    const enable = await notifications.subscribed(wallet.active.rawAddress);
                    if (enable) {
                        for (let connection of data.connections) {
                            await notifications.subscribeTonConnect(
                                connection.clientSessionId,
                                new URL(connection.manifest.url).host
                            );
                        }
                    }
                } catch (e) {
                    if (e instanceof Error) sdk.topMessage(e.message);
                }
            }
        })();

        const close = subscribeTonConnect({
            storage: sdk.storage,
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
