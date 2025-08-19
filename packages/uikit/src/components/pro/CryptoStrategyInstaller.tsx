import { FC, ReactNode, useEffect } from 'react';
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
    const { onOpen: onProConfirmOpen } = useProConfirmNotification();

    useEffect(() => {
        const strategy = new CryptoSubscriptionStrategy(sdk, {
            api,
            onProConfirmOpen
        });

        sdk.setSubscriptionStrategy(strategy);
    }, []);

    return <>{children}</>;
};
