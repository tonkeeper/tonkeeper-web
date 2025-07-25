import { useEffect } from 'react';
import { tonConnectAppManuallyDisconnected$ } from '@tonkeeper/uikit/dist/state/tonConnect';
import { sendBackground } from '../event';
import { isAccountConnectionInjected } from '@tonkeeper/core/dist/service/tonConnect/connectionService';

export const TonConnectSubscription = () => {
    useEffect(() => {
        return tonConnectAppManuallyDisconnected$.subscribe(value => {
            const connections = Array.isArray(value) ? value : [value];
            const injected = connections.filter(isAccountConnectionInjected);

            if (injected.length > 0) {
                sendBackground.message(
                    'tonConnectDisconnect',
                    injected.map(c => c.webViewOrigin)
                );
            }
        });
    }, []);

    return null;
};
