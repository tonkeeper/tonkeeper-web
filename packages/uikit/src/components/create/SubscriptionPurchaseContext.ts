import { createContext } from 'react';

import { PurchaseSubscriptionScreens } from '../../enums/pro';

export interface IPurchaseScreenState {
    currentScreen: PurchaseSubscriptionScreens;
    prevScreen: PurchaseSubscriptionScreens | null;
}

export interface IPurchaseControl {
    goTo: (screen: PurchaseSubscriptionScreens) => void;
    onClose: () => void;
}

export const PurchaseScreenContext = createContext<IPurchaseScreenState | undefined>(undefined);
export const PurchaseControlContext = createContext<IPurchaseControl | undefined>(undefined);
