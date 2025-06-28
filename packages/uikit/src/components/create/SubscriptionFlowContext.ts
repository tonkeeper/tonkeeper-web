import { createContext } from 'react';
import { SubscriptionScreens } from '../../enums/pro';

export const ScreenContext = createContext<SubscriptionScreens>(SubscriptionScreens.ACCOUNTS);
export const GoToContext = createContext<(screen: SubscriptionScreens) => void>(() => {});
