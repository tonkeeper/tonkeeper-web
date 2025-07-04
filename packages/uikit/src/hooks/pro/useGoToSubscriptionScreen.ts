import { useContext } from 'react';

import { SubscriptionScreens } from '../../enums/pro';
import { GoToContext } from '../../components/create/SubscriptionFlowContext';

export const useGoToSubscriptionScreen = (): ((screen: SubscriptionScreens) => void) => {
    const ctx = useContext(GoToContext);

    if (!ctx) {
        throw new Error('useGoToSubscriptionScreen must be used within SubscriptionFlowProvider');
    }

    return ctx;
};
