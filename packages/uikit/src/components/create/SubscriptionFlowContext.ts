import { createContext } from 'react';
import { SubscriptionScreens } from '../../enums/pro';

export interface IScreenState {
    currentScreen: SubscriptionScreens;
    prevScreen: SubscriptionScreens | null;
}

export const ScreenContext = createContext<IScreenState | undefined>(undefined);
export const GoToContext = createContext<((screen: SubscriptionScreens) => void) | undefined>(
    undefined
);
