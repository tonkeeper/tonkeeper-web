import { useContext } from 'react';

import {
    IPurchaseControl,
    PurchaseControlContext
} from '../../components/create/SubscriptionPurchaseContext';

export const usePurchaseControlScreen = (): IPurchaseControl => {
    const ctx = useContext(PurchaseControlContext);

    if (!ctx) {
        throw new Error(
            'usePurchaseControlScreen must be used within SubscriptionPurchaseProvider'
        );
    }

    return ctx;
};

export const useSafePurchaseControlScreen = (): IPurchaseControl | undefined => {
    return useContext(PurchaseControlContext);
};
