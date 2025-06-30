import { type FC, type ReactNode, useCallback, useState } from 'react';

import { SubscriptionScreens } from '../enums/pro';
import {
    GoToContext,
    IScreenState,
    ScreenContext
} from '../components/create/SubscriptionFlowContext';

interface IProps {
    children: ReactNode;
}

export const SubscriptionFlowProvider: FC<IProps> = ({ children }) => {
    const [screen, setScreen] = useState<IScreenState>({
        currentScreen: SubscriptionScreens.ACCOUNTS,
        prevScreen: null
    });

    const goTo = useCallback((nextScreen: SubscriptionScreens) => {
        setScreen(prevState => ({
            currentScreen: nextScreen,
            prevScreen: prevState.currentScreen
        }));
    }, []);

    return (
        <ScreenContext.Provider value={screen}>
            <GoToContext.Provider value={goTo}>{children}</GoToContext.Provider>
        </ScreenContext.Provider>
    );
};
