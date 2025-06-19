import { TonConnectRequestNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectRequestNotification';
import { useSendNotificationAnalytics } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useCallback, useEffect, useState } from 'react';
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

export const TonConnectSubscription = () => {
    const [request, setRequest] = useState<TonConnectAppRequestPayload | undefined>(undefined);

    const disconnect = useDisconnectTonConnectConnection({ skipEmit: true });

    const queryClient = useQueryClient();

    const onTransaction = useCallback(
        async (request: TonConnectAppRequestPayload) => {
            await queryClient.invalidateQueries([QueryKey.account]);
            setRequest(request);
        },
        [setRequest]
    );

    useSendNotificationAnalytics(request?.connection?.manifest);

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

    const { mutateAsync: responseAsync } = useTonConnectHttpResponseMutation();
    const handleClose = useCallback(
        async (response: WalletResponse<RpcMethod>) => {
            if (request?.connection.type !== 'http') {
                return;
            }

            try {
                await responseAsync({ connection: request.connection, response });
            } finally {
                setRequest(undefined);
            }
        },
        [responseAsync, request?.connection]
    );

    return <TonConnectRequestNotification request={request} handleClose={handleClose} />;
};
