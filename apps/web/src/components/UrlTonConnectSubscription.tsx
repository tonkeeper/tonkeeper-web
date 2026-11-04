import { DAppManifest, TonConnectEventPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { TonConnectHttpConnectionParams } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { TonConnectNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectNotification';
import { useCompleteHttpConnection } from '@tonkeeper/uikit/dist/components/connect/connectHook';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from '@tonkeeper/uikit/dist/hooks/router/useNavigate';
import { AppRoute } from '@tonkeeper/uikit/dist/libs/routes';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import { useDeeplinkHandlers } from '@tonkeeper/uikit/dist/hooks/deeplinks/useDeeplinkHandlers';
import { MultichainConnectFlow } from '@tonkeeper/uikit/dist/pages/home/multichain/connect/MultichainConnectFlow';
import { useActiveAccount } from '@tonkeeper/uikit/dist/state/wallet';
import { useTrackDeeplinkOpen } from '@tonkeeper/uikit/dist/hooks/analytics/deeplink-open';

// Cold-boot landing paths a dApp connect modal redirects to: `/ton-connect`
// carries a TonConnect request (`?v=2&id=&r=`), `/wc` a WalletConnect pairing
// (`?uri=`). Both feed the same handler — it routes by the payload shape.
const CONNECT_TRIGGER_PATHS = ['/ton-connect', '/wc'];

export const UrlTonConnectSubscription = () => {
    const [params, setParams] = useState<TonConnectHttpConnectionParams | null>(null);

    const { mutateAsync: parseParams, reset } = useDeeplinkHandlers();
    const { mutateAsync: responseConnectionAsync, reset: responseReset } =
        useCompleteHttpConnection();
    const isMultichainActive = useActiveAccount().type === 'multichain';
    const trackDeeplinkOpen = useTrackDeeplinkOpen();

    const handlerClose = async (
        result:
            | {
                  replyItems: TonConnectEventPayload;
                  manifest: DAppManifest;
                  account: Account;
                  walletId: WalletId;
              }
            | null
            | TonConnectError
    ) => {
        if (!params) return;
        responseReset();
        try {
            await responseConnectionAsync({ params, result });
        } finally {
            setParams(null);
        }
    };

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (CONNECT_TRIGGER_PATHS.includes(location.pathname)) {
            // A dApp hands the web wallet its link by loading it in a new
            // page, so the link always boots the app.
            trackDeeplinkOpen(window.location.href, true);
            reset();
            parseParams(window.location.href).then(setParams);
            navigate(AppRoute.home, { replace: true });
        }
    }, [location, navigate, trackDeeplinkOpen]);

    // Multichain accounts get the redesigned connect flow; legacy accounts
    // keep the untouched legacy notification.
    if (isMultichainActive) {
        return (
            <MultichainConnectFlow
                request={params ? { protocol: 'tonConnect', params } : null}
                onClose={() => handlerClose(null)}
                onTonConnectComplete={handlerClose}
            />
        );
    }

    return (
        <TonConnectNotification
            origin={undefined}
            params={params ?? null}
            handleClose={handlerClose}
        />
    );
};
