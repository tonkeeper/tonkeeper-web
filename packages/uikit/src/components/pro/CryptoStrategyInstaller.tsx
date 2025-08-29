import { FC, ReactNode, useEffect, useState } from 'react';

import { useAppSdk } from '../../hooks/appSdk';
import { useActiveApi } from '../../state/wallet';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';
import { CryptoSubscriptionStrategy } from '@tonkeeper/core/dist/CryptoSubscriptionStrategy';
import { SubscriptionService } from '@tonkeeper/core/SubscriptionService';

interface Props {
    children: ReactNode;
}

export const CryptoStrategyInstaller: FC<Props> = ({ children }) => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!sdk || !api) return;

        if (!sdk.subscriptionService) {
            sdk.subscriptionService = new SubscriptionService(sdk.storage, {
                initialStrategyMap: new Map([
                    [SubscriptionSource.CRYPTO, new CryptoSubscriptionStrategy()]
                ])
            });
        }

        if (!sdk.subscriptionService.getStrategy(SubscriptionSource.CRYPTO)) {
            sdk.subscriptionService.addStrategy(new CryptoSubscriptionStrategy());
        }

        setIsReady(true);
    }, [sdk, api]);

    return isReady ? <>{children}</> : null;
};
