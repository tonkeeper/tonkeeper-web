import { FC, ReactNode, Suspense, useEffect, useRef } from 'react';
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
    const isReadyRef = useRef(false);
    const { onOpen: onProConfirmOpen } = useProConfirmNotification();

    useEffect(() => {
        if (isReadyRef.current || !sdk || !api) return;

        sdk.subscriptionStrategy = new CryptoSubscriptionStrategy(sdk.storage, {
            api,
            onProConfirmOpen
        });

        isReadyRef.current = true;
    }, [api, sdk]);

    return <Suspense fallback={null}>{children}</Suspense>;
};
