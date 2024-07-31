import { useMutation } from '@tanstack/react-query';
import { TonConnectAppRequest } from '@tonkeeper/core/dist/entries/tonConnect';
import {
    replyBadRequestResponse,
    replyDisconnectResponse
} from '@tonkeeper/core/dist/service/tonConnect/actionService';
import { subscribeTonConnect } from '@tonkeeper/core/dist/service/tonConnect/httpBridge';
import { useCallback, useEffect, useState } from 'react';
import { useSendNotificationAnalytics } from '../../hooks/amplitude';
import { useAppSdk } from '../../hooks/appSdk';
import {
    tonConnectAppManuallyDisconnected$,
    useAppTonConnectConnections,
    useDisconnectTonConnectApp,
    useTonConnectLastEventId
} from '../../state/tonConnect';
import { TonTransactionNotification } from './TonTransactionNotification';
import { SendTransactionAppRequest, useResponseSendMutation } from './connectHook';

import { useActiveWallet, useMutateActiveTonWallet } from '../../state/wallet';

const useUnSupportMethodMutation = () => {
    return useMutation<void, Error, TonConnectAppRequest>(replyBadRequestResponse);
};

const TonConnectSubscription = () => {
    const [request, setRequest] = useState<SendTransactionAppRequest | undefined>(undefined);

    const sdk = useAppSdk();
    const wallet = useActiveWallet();
    const { data: appConnections } = useAppTonConnectConnections();
    const { data: lastEventId } = useTonConnectLastEventId();

    const { mutateAsync: disconnect } = useDisconnectTonConnectApp();
    const { mutate: badRequestResponse } = useUnSupportMethodMutation();
    const { mutateAsync: responseSendAsync } = useResponseSendMutation();

    useSendNotificationAnalytics(request?.connection?.manifest);
    const { mutateAsync: setActiveWallet } = useMutateActiveTonWallet();

    useEffect(() => {
        const handleMessage = (params: TonConnectAppRequest) => {
            switch (params.request.method) {
                case 'disconnect': {
                    return disconnect(params.connection).then(() =>
                        replyDisconnectResponse({ ...params })
                    );
                }
                case 'sendTransaction': {
                    setRequest(undefined);
                    const value = {
                        connection: params.connection,
                        id: params.request.id,
                        payload: JSON.parse(params.request.params[0])
                    };
                    const walletToActivate = appConnections?.find(i =>
                        i.connections.some(
                            c => c.clientSessionId === params.connection.clientSessionId
                        )
                    );

                    if (walletToActivate) {
                        setActiveWallet(walletToActivate.wallet.rawAddress).then(() =>
                            setTimeout(() => {
                                setRequest(value);
                            }, 100)
                        );
                    } else {
                        setTimeout(() => {
                            setRequest(value);
                        }, 100);
                    }

                    return;
                }
                default: {
                    return badRequestResponse(params);
                }
            }
        };

        const { notifications } = sdk;
        (async () => {
            if (notifications && appConnections) {
                try {
                    const enable = await notifications.subscribed(wallet.rawAddress);
                    if (enable) {
                        for (const connection of appConnections.flatMap(i => i.connections)) {
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
            connections: appConnections?.flatMap(i => i.connections),
            lastEventId
        });

        return () => {
            close();
        };
    }, [sdk, appConnections, lastEventId, disconnect, setRequest, badRequestResponse]);

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

    useEffect(() => {
        return tonConnectAppManuallyDisconnected$.subscribe(connection => {
            const connectionsToDisconnect = Array.isArray(connection) ? connection : [connection];
            connectionsToDisconnect.forEach((item, index) =>
                replyDisconnectResponse({
                    connection: item,
                    request: { id: (Date.now() + index).toString() }
                })
            );
        });
    }, []);

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
