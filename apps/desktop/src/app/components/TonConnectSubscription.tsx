import { TonConnectRequestNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectRequestNotification';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    tonConnectAppManuallyDisconnected$,
    useDisconnectTonConnectConnection
} from '@tonkeeper/uikit/dist/state/tonConnect';
import { sendBackground } from '../../libs/backgroudService';
import {
    RpcMethod,
    TonConnectAppRequestPayload,
    WalletResponse
} from '@tonkeeper/core/dist/entries/tonConnect';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useQueryClient } from '@tanstack/react-query';
import { useTonConnectHttpResponseMutation } from '@tonkeeper/uikit/dist/components/connect/connectHook';
import { isAccountConnectionHttp } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { sendBadRequestResponse } from '@tonkeeper/core/dist/service/tonConnect/connectService';

export const TonConnectSubscription = () => {
    const [request, setRequest] = useState<TonConnectAppRequestPayload | undefined>(undefined);
    /** Set as soon as a request is accepted; one request is confirmed at a time. */
    const pendingRequestId = useRef<string | undefined>(undefined);

    const disconnect = useDisconnectTonConnectConnection({ skipEmit: true });

    const queryClient = useQueryClient();
    const { mutateAsync: responseAsync } = useTonConnectHttpResponseMutation();

    const onTransaction = useCallback(
        async (value: TonConnectAppRequestPayload) => {
            if (pendingRequestId.current !== undefined) {
                if (value.connection.type === 'http') {
                    await responseAsync({
                        connection: value.connection,
                        response: sendBadRequestResponse(
                            value.id,
                            value.kind,
                            'Another request is in progress'
                        )
                    });
                }
                return;
            }
            pendingRequestId.current = value.id;
            await queryClient.invalidateQueries([QueryKey.account]);
            setRequest(value);
        },
        [queryClient, responseAsync]
    );

    useEffect(() => {
        window.backgroundApi.onTonConnectRequest(onTransaction);
    }, [onTransaction]);

    useEffect(() => {
        window.backgroundApi.onTonConnectDisconnect(disconnect);
    }, [disconnect]);

    useEffect(() => {
        return tonConnectAppManuallyDisconnected$.subscribe(value => {
            const connections = Array.isArray(value) ? value : [value];
            const httpConnections = connections.filter(isAccountConnectionHttp);

            if (httpConnections.length > 0) {
                sendBackground({
                    king: 'ton-connect-send-disconnect',
                    connection: httpConnections
                });
            }
        });
    }, []);

    const handleClose = useCallback(
        async (response: WalletResponse<RpcMethod>) => {
            if (request?.connection.type !== 'http') {
                return;
            }

            try {
                await responseAsync({ connection: request.connection, response });
            } finally {
                setRequest(undefined);
                pendingRequestId.current = undefined;
            }
        },
        [responseAsync, request?.connection]
    );

    return <TonConnectRequestNotification request={request} handleClose={handleClose} />;
};
