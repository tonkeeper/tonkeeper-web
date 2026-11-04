import { useMutation } from '@tanstack/react-query';
import {
    RpcMethod,
    SignDataRequestPayload,
    WalletResponse,
    TonConnectAppRequest,
    TonConnectAppRequestPayload,
    TonConnectTransactionPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import {
    replyHttpBadRequestResponse,
    replyHttpDisconnectResponse
} from '@tonkeeper/core/dist/service/tonConnect/actionService';
import { checkTonConnectFromAndNetwork } from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { subscribeTonConnect } from '@tonkeeper/core/dist/service/tonConnect/httpBridge';
import { walletIdOfClientSession } from '@tonkeeper/core/dist/service/tonConnect/sessionOwner';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useTonConnectHttpResponseMutation } from './connectHook';
import { useAppContext } from '../../hooks/appContext';

const useUnSupportMethodMutation = () => {
    return useMutation<void, Error, TonConnectAppRequest<'http'> & { bridgeEndpoint: string }>(
        replyHttpBadRequestResponse
    );
};

const BROADCAST_TAG = 'TK_WEB::TON_CONNECT';

const WebTonConnectSubscription = () => {
    const [request, setRequest] = useState<TonConnectAppRequestPayload | undefined>(undefined);
    /** Id of the request being confirmed, set before the sheet opens. */
    const pendingRequestId = useRef<string | undefined>(undefined);

    const sdk = useAppSdk();
    const wallet = useActiveWallet();
    const { data: appConnections } = useAppTonConnectConnections('http');
    const { data: lastEventId } = useTonConnectLastEventId();

    const disconnect = useDisconnectTonConnectConnection({ skipEmit: true });
    const { mutate: badRequestResponse } = useUnSupportMethodMutation();

    const { mutateAsync: setActiveWallet } = useMutateActiveTonWallet();
    const { mutateAsync: sendResponse } = useTonConnectHttpResponseMutation();

    const { mainnetConfig } = useAppContext();

    useEffect(() => {
        const replyBadRequest = (params: TonConnectAppRequest<'http'>, message: string) =>
            replyHttpBadRequestResponse({
                ...params,
                message,
                bridgeEndpoint: mainnetConfig.ton_connect_bridge
            });

        /**
         * Binds the request to the wallet its session belongs to and opens
         * the confirmation for it. One request is confirmed at a time.
         */
        const openRequest = async (
            params: TonConnectAppRequest<'http'>,
            rawPayload: string,
            toValue: (
                walletId: WalletId,
                payload: TonConnectAppRequestPayload['payload']
            ) => TonConnectAppRequestPayload
        ) => {
            const payload = JSON.parse(rawPayload);

            if (pendingRequestId.current !== undefined) {
                return replyBadRequest(params, 'Another request is in progress');
            }
            pendingRequestId.current = params.request.id;

            const fail = (message: string) => {
                pendingRequestId.current = undefined;
                return replyBadRequest(params, message);
            };

            const walletId = walletIdOfClientSession(
                appConnections ?? [],
                params.connection.clientSessionId
            );
            const requestWallet = appConnections?.find(i => i.wallet.id === walletId)?.wallet;
            if (!requestWallet) {
                return fail('Unknown session');
            }

            try {
                await checkTonConnectFromAndNetwork(sdk.storage, requestWallet, payload);
                await setActiveWallet(requestWallet.id);
            } catch (e) {
                return fail(e instanceof TonConnectError ? e.message : 'Bad request');
            }

            setTimeout(() => setRequest(toValue(requestWallet.id, payload)), 100);
        };

        const handleMessage = async (params: TonConnectAppRequest<'http'>) => {
            switch (params.request.method) {
                case 'disconnect': {
                    return disconnect(params.connection).then(() =>
                        replyHttpDisconnectResponse({
                            ...params,
                            bridgeEndpoint: mainnetConfig.ton_connect_bridge
                        })
                    );
                }
                case 'sendTransaction': {
                    return openRequest(params, params.request.params[0], (walletId, payload) => ({
                        connection: params.connection,
                        id: params.request.id,
                        walletId,
                        kind: 'sendTransaction',
                        payload: payload as TonConnectTransactionPayload
                    }));
                }
                case 'signData': {
                    return openRequest(params, params.request.params[0], (walletId, payload) => ({
                        connection: params.connection,
                        id: params.request.id,
                        walletId,
                        kind: 'signData',
                        payload: payload as SignDataRequestPayload
                    }));
                }
                default: {
                    return badRequestResponse({
                        ...params,
                        bridgeEndpoint: mainnetConfig.ton_connect_bridge
                    });
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
            lastEventId: lastEventId ?? undefined,
            bridgeEndpoint: mainnetConfig.ton_connect_bridge
        });

        return () => {
            close();
        };
    }, [
        sdk,
        appConnections,
        lastEventId,
        disconnect,
        setRequest,
        setActiveWallet,
        badRequestResponse,
        mainnetConfig.ton_connect_bridge,
        wallet.rawAddress
    ]);

    const handleClose = useCallback(
        async (result: WalletResponse<RpcMethod>) => {
            if (!request) return;
            setRequest(undefined);
            pendingRequestId.current = undefined;

            if (request.connection.type === 'http') {
                await sendResponse({
                    connection: request.connection,
                    response: result
                });
            }
            sendBroadcastMessage(
                BROADCAST_TAG,
                JSON.stringify({ event: 'close-tx-confirmation', id: request.id })
            );
        },
        [request, setRequest, sendResponse]
    );

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
                pendingRequestId.current = undefined;
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
                        request: { id: (Date.now() + index).toString() },
                        bridgeEndpoint: mainnetConfig.ton_connect_bridge
                    });
                }
            });
        });
    }, [mainnetConfig.ton_connect_bridge]);

    return <TonConnectRequestNotification request={request} handleClose={handleClose} />;
};

export default WebTonConnectSubscription;
