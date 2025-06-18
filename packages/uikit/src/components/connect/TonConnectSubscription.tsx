import { useMutation } from '@tanstack/react-query';
import {
    TonConnectAppRequest,
    TonConnectAppRequestPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
    replyHttpBadRequestResponse,
    replyHttpDisconnectResponse
} from '@tonkeeper/core/dist/service/tonConnect/actionService';
import { subscribeTonConnect } from '@tonkeeper/core/dist/service/tonConnect/httpBridge';
import { useCallback, useEffect, useState } from 'react';
import { useSendNotificationAnalytics } from '../../hooks/amplitude';
import { useAppSdk } from '../../hooks/appSdk';
import {
    tonConnectAppManuallyDisconnected$,
    useAppTonConnectConnections,
    useDisconnectTonConnectConnection,
    useTonConnectLastEventId
} from '../../state/tonConnect';
import { useActiveWallet, useMutateActiveTonWallet } from '../../state/wallet';
import { listenBroadcastMessages, sendBroadcastMessage } from '../../libs/web';
import { TonConnectRequestNotification } from './TonConnectRequestNotification';

const useUnSupportMethodMutation = () => {
    return useMutation<void, Error, TonConnectAppRequest<'http'>>(replyHttpBadRequestResponse);
};

const BROADCAST_TAG = 'TK_WEB::TON_CONNECT';

const TonConnectSubscription = () => {
    const [request, setRequest] = useState<TonConnectAppRequestPayload | undefined>(undefined);

    const sdk = useAppSdk();
    const wallet = useActiveWallet();
    const { data: appConnections } = useAppTonConnectConnections('http');
    const { data: lastEventId } = useTonConnectLastEventId();

    const disconnect = useDisconnectTonConnectConnection({ skipEmit: true });
    const { mutate: badRequestResponse } = useUnSupportMethodMutation();

    useSendNotificationAnalytics(request?.connection?.manifest);
    const { mutateAsync: setActiveWallet } = useMutateActiveTonWallet();

    useEffect(() => {
        const openNotification = (clientSessionId: string, value: TonConnectAppRequestPayload) => {
            const walletToActivate = appConnections?.find(i =>
                i.connections.some(c => c.clientSessionId === clientSessionId)
            );

            if (walletToActivate) {
                setActiveWallet(walletToActivate.wallet.id).then(() =>
                    setTimeout(() => {
                        setRequest(value);
                    }, 100)
                );
            } else {
                setTimeout(() => {
                    setRequest(value);
                }, 100);
            }
        };
        const handleMessage = (params: TonConnectAppRequest<'http'>) => {
            switch (params.request.method) {
                case 'disconnect': {
                    return disconnect(params.connection).then(() =>
                        replyHttpDisconnectResponse({ ...params })
                    );
                }
                case 'sendTransaction': {
                    setRequest(undefined);
                    const value: TonConnectAppRequestPayload = {
                        connection: params.connection,
                        id: params.request.id,
                        kind: 'sendTransaction',
                        payload: JSON.parse(params.request.params[0])
                    };
                    return openNotification(params.connection.clientSessionId, value);
                }
                case 'signData': {
                    setRequest(undefined);
                    const value: TonConnectAppRequestPayload = {
                        connection: params.connection,
                        id: params.request.id,
                        kind: 'signData',
                        payload: JSON.parse(params.request.params[0])
                    };
                    return openNotification(params.connection.clientSessionId, value);
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

    const handleClose = useCallback(() => {
        if (!request) return;
        setRequest(undefined);

        sendBroadcastMessage(
            BROADCAST_TAG,
            JSON.stringify({ event: 'close-tx-confirmation', id: request.id })
        );
    }, [request, setRequest]);

    useEffect(() => {
        if (!request) {
            return;
        }

        return listenBroadcastMessages(BROADCAST_TAG, message => {
            const val = JSON.parse(message);
            if (val.id !== request.id) {
                return;
            }

            if (val.event === 'close-tx-confirmation') {
                setRequest(undefined);
            }
        });
    }, [request]);

    useEffect(() => {
        return tonConnectAppManuallyDisconnected$.subscribe(connection => {
            const connectionsToDisconnect = Array.isArray(connection) ? connection : [connection];
            connectionsToDisconnect.forEach((item, index) => {
                if (item.type === 'http') {
                    replyHttpDisconnectResponse({
                        connection: item,
                        request: { id: (Date.now() + index).toString() }
                    });
                }
            });
        });
    }, []);

    return <TonConnectRequestNotification request={request} handleClose={handleClose} />;
};

export default TonConnectSubscription;
