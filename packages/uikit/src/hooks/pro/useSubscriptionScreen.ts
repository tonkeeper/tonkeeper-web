import { useContext } from 'react';

import { IScreenState, ScreenContext } from '../../components/create/SubscriptionFlowContext';

export const useSubscriptionScreen = (): IScreenState => {
    const ctx = useContext(ScreenContext);

    if (ctx === null) {
        throw new Error('useSubscriptionScreen must be used within SubscriptionFlowProvider');
    }

    return ctx;
};
