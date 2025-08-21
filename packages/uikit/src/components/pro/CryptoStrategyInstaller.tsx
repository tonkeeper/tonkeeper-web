import { FC, ReactNode, useEffect, useState } from 'react';
import { CryptoSubscriptionStrategy } from '@tonkeeper/core/dist/CryptoSubscriptionStrategy';

import { useAppSdk } from '../../hooks/appSdk';
import { useActiveApi } from '../../state/wallet';
import { useProConfirmNotification } from '../modals/ProConfirmNotificationControlled';

interface Props {
    children: ReactNode;
}

export const CryptoStrategyInstaller: FC<Props> = ({ children }) => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const [isReady, setIsReady] = useState(false);
    const { onOpen: onProConfirmOpen } = useProConfirmNotification();

    useEffect(() => {
        if (sdk?.subscriptionStrategy || !sdk || !api) return;

        sdk.subscriptionStrategy = new CryptoSubscriptionStrategy(sdk.storage, {
            api,
            onProConfirmOpen
        });

        setIsReady(true);
    }, [api, sdk]);

    return isReady ? <>{children}</> : null;
};
