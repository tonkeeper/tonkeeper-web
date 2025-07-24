import {
    ConnectEvent,
    ConnectRequest,
    SignDataResponse
} from '@tonkeeper/core/dist/entries/tonConnect';
import { TonConnectNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectNotification';
import { TonTransactionNotification } from '@tonkeeper/uikit/dist/components/connect/TonTransactionNotification';
import { SignDataNotification } from '@tonkeeper/uikit/dist/components/connect/SignDataNotification';
import { useEffect, useState } from 'react';
import { extensionBackgroundEvents$, sendBackground } from '../event';
import { NotificationData } from '../libs/event';
import { tonConnectTonkeeperAppName } from '@tonkeeper/core/dist/service/tonConnect/connectService';
import {
    useCompleteInjectedConnection,
    useProcessOpenedLink
} from '@tonkeeper/uikit/dist/components/connect/connectHook';
import { tonConnectProtocolVersion } from '../constants';
import {
    useTrackerTonConnectSendSuccess,
    useTrackTonConnectActionRequest
} from '@tonkeeper/uikit/dist/hooks/analytics/events-hooks';
import { SenderChoice } from '@tonkeeper/uikit/dist/hooks/blockchain/useSender';
import { InterceptTonLinkNotification } from './InterceptTonLinkNotification';
import { useGlobalPreferences } from '@tonkeeper/uikit/dist/state/global-preferences';
import { useSubjectValue } from '@tonkeeper/uikit/dist/libs/useAtom';

const bridgeConnectTransport = (id: number) => (e: ConnectEvent) => {
    if (e.event === 'connect') {
        sendBackground.message('approveRequest', {
            id,
            payload: e.payload
        });
    } else {
        sendBackground.message('rejectRequest', id);
    }
};

export const Notifications = () => {
    const [data, setData] = useState<NotificationData | undefined>(undefined);

    useTrackTonConnectActionRequest(data?.origin);
    const trackSendSuccess = useTrackerTonConnectSendSuccess();

    const { mutateAsync: processOpenedLink } = useProcessOpenedLink();
    const { interceptTonLinks } = useGlobalPreferences();

    const backgroundEvent = useSubjectValue(extensionBackgroundEvents$);

    useEffect(() => {
        if (backgroundEvent?.type === 'showNotification') {
            if (data) {
                sendBackground.message('rejectRequest', data.id);
            }
            const newData = backgroundEvent.data;

            if (newData.kind === 'tonLinkIntercept' && interceptTonLinks === 'always') {
                if (newData.data.url) {
                    sendBackground.message('approveRequest', {
                        id: newData.id,
                        payload: void 0
                    });
                    processOpenedLink(newData.data.url);
                }
            } else {
                setData(newData);
            }
        }
    }, [backgroundEvent]);

    const { mutateAsync: completeInjectedConnection } = useCompleteInjectedConnection();

    return (
        <>
            <TonConnectNotification
                origin={data?.origin}
                params={
                    data?.kind === 'tonConnectRequest'
                        ? { request: data.data, appName: tonConnectTonkeeperAppName }
                        : null
                }
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
                    });
                    setData(undefined);
                }}
            />
            <TonTransactionNotification
                params={data?.kind === 'tonConnectSend' ? data.data : null}
                handleClose={(payload?: { boc: string; senderChoice: SenderChoice }) => {
                    if (!data) return;
                    if (payload) {
                        sendBackground.message('approveRequest', {
                            id: data.id,
                            payload: payload.boc
                        });
                        trackSendSuccess({ dappUrl: data.origin, sender: payload.senderChoice });
                    } else {
                        sendBackground.message('rejectRequest', data.id);
                    }
                    setData(undefined);
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
                    setData(undefined);
                }}
            />
            <InterceptTonLinkNotification
                url={data?.kind === 'tonLinkIntercept' ? data.data?.url : null}
                handleClose={(processInExtension?: boolean) => {
                    if (!data) return;
                    if (processInExtension) {
                        sendBackground.message('approveRequest', { id: data.id, payload: void 0 });
                    } else {
                        sendBackground.message('rejectRequest', data.id);
                    }
                    setData(undefined);
                }}
            />
        </>
    );
};
