import {
    ConnectEvent,
    ConnectRequest,
    SignDataResponse
} from '@tonkeeper/core/dist/entries/tonConnect';
import { TonConnectNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectNotification';
import { TonTransactionNotification } from '@tonkeeper/uikit/dist/components/connect/TonTransactionNotification';
import { SignDataNotification } from '@tonkeeper/uikit/dist/components/connect/SignDataNotification';
import { useEffect, useMemo, useRef, useState } from 'react';
import { extensionBackgroundEvents$, sendBackground } from '../event';
import { NotificationData } from '../libs/event';
import { tonConnectTonkeeperAppName } from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { useCompleteInjectedConnection } from '@tonkeeper/uikit/dist/components/connect/connectHook';
import { tonConnectProtocolVersion } from '../constants';
import {
    useTrackDappTransactionSent,
    useTrackerTonConnectSendSuccess,
    useTrackTonConnectActionRequest
} from '@tonkeeper/uikit/dist/hooks/analytics/events-hooks';
import { TonConnectRequestAnalyticsProvider } from '@tonkeeper/uikit/dist/hooks/analytics/ton-connect';
import { SenderChoice } from '@tonkeeper/uikit/dist/hooks/blockchain/useSender';
import { InterceptTonLinkNotification } from './InterceptTonLinkNotification';
import { TonLinkOpenTarget } from '../libs/tonTransferLink';
import { EvmConnectNotification } from './connect/EvmConnectNotification';
import { EvmSignNotification } from './connect/EvmSignNotification';
import { useEnsureChainKitReady } from '@tonkeeper/uikit/dist/hooks/useEnsureChainKitReady';
import { useGlobalPreferences } from '@tonkeeper/uikit/dist/state/global-preferences';
import { useSubjectValue } from '@tonkeeper/uikit/dist/libs/useAtom';
import { useDeeplinkHandlers } from '@tonkeeper/uikit/dist/hooks/deeplinks/useDeeplinkHandlers';

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

    useEnsureChainKitReady();
    useTrackTonConnectActionRequest(data?.origin);
    const trackSendSuccess = useTrackerTonConnectSendSuccess();
    const trackTransactionSent = useTrackDappTransactionSent();

    const { mutateAsync: processOpenedLink } = useDeeplinkHandlers();
    const { interceptTonLinks } = useGlobalPreferences();

    const backgroundEvent = useSubjectValue(extensionBackgroundEvents$);

    // Each event must be consumed exactly once. The effect also re-runs on
    // `data` changes while `backgroundEvent` still holds the last replayed
    // event — without the guard, that re-run rejects the just-shown request
    // and later re-opens the modal from the stale event after any click.
    const handledEvent = useRef<typeof backgroundEvent>();
    useEffect(() => {
        if (backgroundEvent?.type !== 'showNotification') return;
        if (handledEvent.current === backgroundEvent) return;
        handledEvent.current = backgroundEvent;

        if (data) {
            sendBackground.message('rejectRequest', data.id);
        }
        const newData = backgroundEvent.data;

        if (newData.kind === 'tonLinkIntercept' && interceptTonLinks === 'always') {
            if (newData.data.url) {
                const target: TonLinkOpenTarget = 'extension';
                sendBackground.message('approveRequest', { id: newData.id, payload: target });
                processOpenedLink(newData.data.url);
            }
        } else {
            setData(newData);
        }
    }, [backgroundEvent, data, interceptTonLinks, processOpenedLink]);

    const { mutateAsync: completeInjectedConnection } = useCompleteInjectedConnection();

    const tonConnectAnalyticsRequest = useMemo(
        () => ({ connectionType: 'injected' as const, dappUrl: data?.origin }),
        [data?.origin]
    );

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
            <TonConnectRequestAnalyticsProvider value={tonConnectAnalyticsRequest}>
                <TonTransactionNotification
                    params={data?.kind === 'tonConnectSend' ? data.data : null}
                    walletId={data?.kind === 'tonConnectSend' ? data.walletId : undefined}
                    dappUrl={data?.kind === 'tonConnectSend' ? data.origin : undefined}
                    handleClose={(payload?: { boc: string; senderChoice: SenderChoice }) => {
                        if (!data) return;
                        if (payload) {
                            sendBackground.message('approveRequest', {
                                id: data.id,
                                payload: payload.boc
                            });
                            trackSendSuccess({
                                dappUrl: data.origin,
                                sender: payload.senderChoice
                            });
                            trackTransactionSent({
                                dappUrl: data.origin,
                                // Every request reaching the extension popup came
                                // from a page in this browser.
                                connectionType: 'injected',
                                senderChoice: payload.senderChoice
                            });
                        } else {
                            sendBackground.message('rejectRequest', data.id);
                        }
                        setData(undefined);
                    }}
                />
                <SignDataNotification
                    origin={data?.kind === 'tonConnectSign' ? data.origin : undefined}
                    params={data?.kind === 'tonConnectSign' ? data.data : null}
                    walletId={data?.kind === 'tonConnectSign' ? data.walletId : undefined}
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
            </TonConnectRequestAnalyticsProvider>
            <InterceptTonLinkNotification
                origin={data?.kind === 'tonLinkIntercept' ? data.origin : undefined}
                url={data?.kind === 'tonLinkIntercept' ? data.data?.url : null}
                handleClose={(target?: TonLinkOpenTarget) => {
                    if (!data) return;
                    if (target) {
                        sendBackground.message('approveRequest', { id: data.id, payload: target });
                    } else {
                        sendBackground.message('rejectRequest', data.id);
                    }
                    setData(undefined);
                }}
            />
            <EvmConnectNotification
                origin={data?.kind === 'evmConnectRequest' ? data.origin : undefined}
                chainId={data?.kind === 'evmConnectRequest' ? data.data.chainId : null}
                onApprove={connection => {
                    if (!data) return;
                    sendBackground.message('approveRequest', { id: data.id, payload: connection });
                    setData(undefined);
                }}
                onReject={() => {
                    if (!data) return;
                    sendBackground.message('rejectRequest', data.id);
                    setData(undefined);
                }}
            />
            <EvmSignNotification
                params={
                    data?.kind === 'evmSignRequest'
                        ? { id: data.id, origin: data.origin, ...data.data }
                        : null
                }
                onResult={result => {
                    if (!data) return;
                    sendBackground.message('approveRequest', { id: data.id, payload: result });
                    setData(undefined);
                }}
                onReject={() => {
                    if (!data) return;
                    sendBackground.message('rejectRequest', data.id);
                    setData(undefined);
                }}
            />
        </>
    );
};
