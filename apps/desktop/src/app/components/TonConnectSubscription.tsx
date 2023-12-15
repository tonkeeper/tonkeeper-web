import {
    responseSendMutation,
    SendTransactionAppRequest
} from '@tonkeeper/uikit/dist/components/connect/connectHook';
import { TonTransactionNotification } from '@tonkeeper/uikit/dist/components/connect/TonTransactionNotification';
import { useSendNotificationAnalytics } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useCallback, useEffect, useState } from 'react';

export const TonConnectSubscription = () => {
    const [request, setRequest] = useState<SendTransactionAppRequest | undefined>(undefined);

    const { mutateAsync: responseSendAsync } = responseSendMutation();

    useSendNotificationAnalytics(request?.connection?.manifest);

    useEffect(() => {
        window.backgroundApi.onTonConnectTransaction(setRequest);
    }, [setRequest]);

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
