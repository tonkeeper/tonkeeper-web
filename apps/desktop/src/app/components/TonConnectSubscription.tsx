import { TonConnectRequestNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectRequestNotification';
import { useSendNotificationAnalytics } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useCallback, useEffect, useState } from 'react';
import {
    tonConnectAppManuallyDisconnected$,
    useDisconnectTonConnectApp
} from '@tonkeeper/uikit/dist/state/tonConnect';
import { sendBackground } from '../../libs/backgroudService';
import { TonConnectAppRequestPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useQueryClient } from '@tanstack/react-query';

export const TonConnectSubscription = () => {
    const [request, setRequest] = useState<TonConnectAppRequestPayload | undefined>(undefined);

    const { mutate: disconnect } = useDisconnectTonConnectApp({ skipEmit: true });

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
            if (value) {
                sendBackground({ king: 'ton-connect-send-disconnect', connection: value });
            }
        });
    }, []);

    const handleClose = useCallback(() => {
        setRequest(undefined);
    }, [setRequest]);

    return <TonConnectRequestNotification request={request} handleClose={handleClose} />;
};
