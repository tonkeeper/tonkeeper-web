import { useMemo } from 'react';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';

import { useAppSdk } from './appSdk';

export const usePrimarySubscriptionSource = () => {
    const sdk = useAppSdk();

    return useMemo(() => {
        const availableSources = sdk.subscriptionService.getAvailableSources();
        const primarySource =
            availableSources.find(source => source === SubscriptionSource.EXTENSION) ??
            availableSources[0];

        return {
            availableSources,
            primarySource
        };
    }, [sdk.subscriptionService]);
};
