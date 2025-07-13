import { useContext } from 'react';

import {
    IPurchaseScreenState,
    PurchaseScreenContext
} from '../../components/create/SubscriptionPurchaseContext';

export const usePurchaseSubscriptionScreen = (): IPurchaseScreenState => {
    const ctx = useContext(PurchaseScreenContext);

    if (!ctx) {
        throw new Error(
            'usePurchaseSubscriptionScreen must be used within SubscriptionPurchaseProvider'
        );
    }

    return ctx;
};
