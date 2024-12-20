import { useResponseSendMutation } from '@tonkeeper/uikit/dist/components/connect/connectHook';
import { TonTransactionNotification } from '@tonkeeper/uikit/dist/components/connect/TonTransactionNotification';
import { useSendNotificationAnalytics } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useCallback, useEffect, useState } from 'react';
import {
    tonConnectAppManuallyDisconnected$,
    useDisconnectTonConnectApp
} from '@tonkeeper/uikit/dist/state/tonConnect';
import { sendBackground } from '../../libs/backgroudService';
import { SendTransactionAppRequest } from '@tonkeeper/core/dist/entries/tonConnect';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useQueryClient } from '@tanstack/react-query';

export const TonConnectSubscription = () => {
    const [request, setRequest] = useState<SendTransactionAppRequest | undefined>(undefined);

    const { mutateAsync: responseSendAsync } = useResponseSendMutation();
    const { mutate: disconnect } = useDisconnectTonConnectApp({ skipEmit: true });

    const queryClient = useQueryClient();

    const onTransaction = useCallback(
        async (request: SendTransactionAppRequest) => {
            await queryClient.invalidateQueries([QueryKey.account]);
            setRequest(request);
        },
        [setRequest]
    );

    useSendNotificationAnalytics(request?.connection?.manifest);

    useEffect(() => {
        window.backgroundApi.onTonConnectTransaction(onTransaction);
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
        <TonTransactionNotification params={request?.payload ?? null} handleClose={handleClose} />
    );
};
