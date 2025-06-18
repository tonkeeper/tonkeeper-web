import { TonConnectRequestNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectRequestNotification';
import { useSendNotificationAnalytics } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    tonConnectAppManuallyDisconnected$,
    useAppTonConnectConnections,
    useDisconnectTonConnectConnection
} from '@tonkeeper/uikit/dist/state/tonConnect';
import {
    RpcMethod,
    TonConnectAppRequestPayload,
    WalletResponse
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
    subscribeToHttpTonConnectDisconnect,
    subscribeToHttpTonConnectRequest,
    tonConnectSSE
} from '../../libs/ton-connect/http-connector';
import { useActiveWallet } from '@tonkeeper/uikit/dist/state/wallet';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useTonConnectHttpResponseMutation } from '@tonkeeper/uikit/dist/components/connect/connectHook';
import { tonConnectInjectedConnector } from '../../libs/ton-connect/injected-connector';
import {
    isAccountConnectionHttp,
    isAccountConnectionInjected
} from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { CapacitorDappBrowser } from '../../libs/plugins/dapp-browser-plugin';
import { useValueRef } from '@tonkeeper/uikit/dist/libs/common';

const useInjectedBridgeRequestsSubscription = (
    setRequest: (params: TonConnectAppRequestPayload) => void
) => {
    const ref = useRef<{
        resolve: (value: WalletResponse<RpcMethod>) => void;
        reject: (reason?: unknown) => void;
    } | null>(null);
    useEffect(() => {
        tonConnectInjectedConnector.setRequestsHandler((request: TonConnectAppRequestPayload) => {
            return new Promise<WalletResponse<RpcMethod>>(async (resolve, reject) => {
                if (ref.current) {
                    ref.current.reject('Request Cancelled');
                }
                ref.current = { resolve, reject };

                await CapacitorDappBrowser.setIsMainViewInFocus(true);
                setRequest(request);
            });
        });
    }, []);

    return ref;
};

const useInjectedBridgeDisconnectSubscription = (onDisconnect: (app: { id: string }) => void) => {
    useEffect(() => {
        tonConnectInjectedConnector.setDisconnectHandler(appId => onDisconnect({ id: appId }));
    }, [onDisconnect]);
};

export const TonConnectSubscription = () => {
    const [request, setRequest] = useState<TonConnectAppRequestPayload | undefined>(undefined);
    const requestRef = useValueRef(request);

    const disconnect = useDisconnectTonConnectConnection({ skipEmit: true });
    const { data: appConnections } = useAppTonConnectConnections();
    const wallet = useActiveWallet();
    const activeWalletConnections = useMemo(
        () => appConnections?.find(c => c.wallet.id === wallet.id)?.connections,
        [appConnections, wallet.id]
    );
    const queryClient = useQueryClient();

    useSendNotificationAnalytics(request?.connection?.manifest);

    const onTransaction = useCallback(async (r: TonConnectAppRequestPayload) => {
        if (requestRef.current) {
            throw new Error('Request already in progress');
        }

        await queryClient.invalidateQueries([QueryKey.account]);
        setRequest(r);
    }, []);

    const injectedBridgeResponseRef = useInjectedBridgeRequestsSubscription(onTransaction);
    useInjectedBridgeDisconnectSubscription(disconnect);

    useEffect(() => subscribeToHttpTonConnectRequest(onTransaction), [onTransaction]);

    useEffect(() => subscribeToHttpTonConnectDisconnect(disconnect), [disconnect]);

    useEffect(() => {
        return tonConnectAppManuallyDisconnected$.subscribe(value => {
            const connections = Array.isArray(value) ? value : [value];
            const httpConnections = connections.filter(isAccountConnectionHttp);
            const injectedConnections = connections.filter(isAccountConnectionInjected);

            if (httpConnections.length > 0) {
                tonConnectSSE.sendDisconnect(httpConnections);
            }

            if (injectedConnections.length > 0) {
                tonConnectInjectedConnector.sendDisconnect(injectedConnections);
            }
        });
    }, []);

    useEffect(() => {
        if (
            activeWalletConnections &&
            JSON.stringify(activeWalletConnections) !==
                JSON.stringify(tonConnectSSE.currentConnections)
        ) {
            tonConnectSSE.reconnect();
        }
    }, [activeWalletConnections]);

    const { mutateAsync: responseAsync } = useTonConnectHttpResponseMutation();
    const handleClose = useCallback(
        async (response: WalletResponse<RpcMethod>) => {
            if (!request) {
                return;
            }

            if (request.connection.type === 'injected') {
                try {
                    if (!injectedBridgeResponseRef.current) {
                        throw new Error('injectedBridgeResponseRef.current is null');
                    }
                    injectedBridgeResponseRef.current.resolve(response);
                    injectedBridgeResponseRef.current = null;
                    return;
                } finally {
                    setRequest(undefined);
                    await CapacitorDappBrowser.setIsMainViewInFocus(false);
                }
            } else {
                try {
                    await responseAsync({ connection: request.connection, response });
                } finally {
                    setRequest(undefined);
                }
            }
        },
        [responseAsync, request?.connection]
    );

    return <TonConnectRequestNotification request={request} handleClose={handleClose} />;
};
