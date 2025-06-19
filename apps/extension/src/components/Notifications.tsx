import { ConnectEvent, ConnectRequest, SignDataResponse } from "@tonkeeper/core/dist/entries/tonConnect";
import { delay } from '@tonkeeper/core/dist/utils/common';
import { TonConnectNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectNotification';
import { TonTransactionNotification } from '@tonkeeper/uikit/dist/components/connect/TonTransactionNotification';
import { SignDataNotification } from '@tonkeeper/uikit/dist/components/connect/SignDataNotification';
import { useNotificationAnalytics } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useCallback, useEffect, useState } from 'react';
import { askBackground, sendBackground } from '../event';
import { NotificationData } from '../libs/event';
import { tonConnectTonkeeperAppName } from "@tonkeeper/core/dist/service/tonConnect/connectService";
import { useCompleteInjectedConnection } from "@tonkeeper/uikit/dist/components/connect/connectHook";
import { tonConnectProtocolVersion } from "../constants";

const bridgeConnectTransport = (id: number) => (e: ConnectEvent) => {
  if (e.event === 'connect') {
      sendBackground.message('approveRequest', {
        id,
        payload: e.payload
      });
  } else {
      sendBackground.message('rejectRequest', id);
  }
}

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

    const { mutateAsync: completeInjectedConnection } = useCompleteInjectedConnection();

    return (
        <>
            <TonConnectNotification
                origin={data?.origin}
                params={data?.kind === 'tonConnectRequest' ? { request: data.data, appName: tonConnectTonkeeperAppName } : null}
                handleClose={async result => {
                    await completeInjectedConnection({
                      params: {
                        type: 'injected',
                        protocolVersion: tonConnectProtocolVersion,
                        request: data!.data as ConnectRequest,
                        appName: tonConnectTonkeeperAppName,
                        webViewOrigin: data!.origin
                      },
                      result,
                      sendBridgeResponse: bridgeConnectTransport(data!.id)
                    })
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
            <SignDataNotification
                origin={data?.kind === 'tonConnectSign' ? data.manifest.url : undefined}
                params={data?.kind === 'tonConnectSign' ? data.data : null}
                handleClose={(payload?: SignDataResponse) => {
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
