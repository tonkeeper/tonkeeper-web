import { useContext } from 'react';

import {
    IPurchaseControl,
    GoToPurchaseContext
} from '../../components/create/SubscriptionPurchaseContext';

export const usePurchaseControlScreen = (): IPurchaseControl => {
    const ctx = useContext(GoToPurchaseContext);

    if (!ctx) {
        throw new Error(
            'usePurchaseControlScreen must be used within SubscriptionPurchaseProvider'
        );
    }

    return ctx;
};
