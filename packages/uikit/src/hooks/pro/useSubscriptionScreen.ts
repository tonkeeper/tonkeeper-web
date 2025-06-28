import { useContext } from 'react';

import { SubscriptionScreens } from '../../enums/pro';
import { ScreenContext } from '../../components/create/SubscriptionFlowContext';

export const useSubscriptionScreen = (): SubscriptionScreens => {
    const ctx = useContext(ScreenContext);

    if (ctx === null) {
        throw new Error('useSubscriptionScreen must be used within SubscriptionFlowProvider');
    }

    return ctx;
};
