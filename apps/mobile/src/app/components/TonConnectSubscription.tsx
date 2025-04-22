import { TonConnectRequestNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectRequestNotification';
import { useSendNotificationAnalytics } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    tonConnectAppManuallyDisconnected$,
    useAppTonConnectConnections,
    useDisconnectTonConnectApp
} from '@tonkeeper/uikit/dist/state/tonConnect';
import { TonConnectAppRequestPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import {
    subscribeToTonConnectDisconnect,
    subscribeToTonConnectRequestTransaction,
    tonConnectSSE
} from '../../libs/tonConnect';
import { useActiveWallet } from '@tonkeeper/uikit/dist/state/wallet';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';

export const TonConnectSubscription = () => {
    const [request, setRequest] = useState<TonConnectAppRequestPayload | undefined>(undefined);

    const { mutate: disconnect } = useDisconnectTonConnectApp({ skipEmit: true });
    const { data: appConnections } = useAppTonConnectConnections();
    const wallet = useActiveWallet();
    const activeWalletConnections = useMemo(
        () => appConnections?.find(c => c.wallet.id === wallet.id)?.connections,
        [appConnections, wallet.id]
    );
    const queryClient = useQueryClient();

    useSendNotificationAnalytics(request?.connection?.manifest);

    const onTransaction = useCallback(
        async (r: TonConnectAppRequestPayload) => {
            await queryClient.invalidateQueries([QueryKey.account]);
            setRequest(r);
        },
        [setRequest]
    );

    useEffect(() => subscribeToTonConnectRequestTransaction(onTransaction), [onTransaction]);

    useEffect(() => subscribeToTonConnectDisconnect(disconnect), [disconnect]);

    useEffect(() => {
        return tonConnectAppManuallyDisconnected$.subscribe(value => {
            if (value) {
                tonConnectSSE.sendDisconnect(value);
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

    const handleClose = useCallback(() => {
        setRequest(undefined);
    }, [setRequest]);

    return <TonConnectRequestNotification request={request} handleClose={handleClose} />;
};
