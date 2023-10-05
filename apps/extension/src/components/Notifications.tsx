import { ConnectItemReply } from '@tonkeeper/core/dist/entries/tonConnect';
import { delay } from '@tonkeeper/core/dist/utils/common';
import { TonConnectNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectNotification';
import { TonTransactionNotification } from '@tonkeeper/uikit/dist/components/connect/TonTransactionNotification';
import { useNotificationAnalytics } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useCallback, useEffect, useState } from 'react';
import { askBackground, sendBackground } from '../event';
import { NotificationData } from '../libs/event';

export const Notifications = () => {
    const [data, setData] = useState<NotificationData | undefined>(undefined);

    const reloadNotification = useCallback(async (wait = true) => {
        setData(undefined);
        if (wait) {
            await delay(300);
        }
        try {
            const item = await askBackground<NotificationData | undefined>().message(
                'getNotification'
            );
            if (item) {
                setData(item);
            } else {
                sendBackground.message('closePopUp');
            }
        } catch (e) {
            sendBackground.message('closePopUp');
        }
    }, []);

    useNotificationAnalytics(data);

    useEffect(() => {
        if (window.location.hash === '#/notification') {
            reloadNotification(false);
        }
    }, []);

    return (
        <>
            <TonConnectNotification
                origin={data?.origin}
                params={data?.kind === 'tonConnectRequest' ? data.data : null}
                handleClose={(payload?: ConnectItemReply[]) => {
                    if (!data) return;
                    if (payload) {
                        sendBackground.message('approveRequest', { id: data.id, payload });
                    } else {
                        sendBackground.message('rejectRequest', data.id);
                    }
                    reloadNotification(true);
                }}
            />
            <TonTransactionNotification
                params={data?.kind === 'tonConnectSend' ? data.data : null}
                handleClose={(payload?: string) => {
                    if (!data) return;
                    if (payload) {
                        sendBackground.message('approveRequest', { id: data.id, payload });
                    } else {
                        sendBackground.message('rejectRequest', data.id);
                    }
                    reloadNotification(true);
                }}
            />
        </>
    );
};
