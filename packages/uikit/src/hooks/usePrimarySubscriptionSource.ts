import { useMemo } from 'react';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';

import { useAppSdk } from './appSdk';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../state/tonendpoint';

export const usePrimarySubscriptionSource = () => {
    const sdk = useAppSdk();
    const isCryptoSubscriptionEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.CRYPTO_SUBSCRIPTION);

    return useMemo(() => {
        const availableSources = sdk.subscriptionService.getAvailableSources();
        const filteredSources = availableSources.filter(source =>
            source === SubscriptionSource.EXTENSION ? isCryptoSubscriptionEnabled : true
        );

        const primarySource =
            filteredSources.find(source => source === SubscriptionSource.EXTENSION) ??
            filteredSources[0] ??
            SubscriptionSource.EXTENSION;

        return {
            primarySource,
            availableSources: filteredSources
        };
    }, [sdk.subscriptionService, isCryptoSubscriptionEnabled]);
};
