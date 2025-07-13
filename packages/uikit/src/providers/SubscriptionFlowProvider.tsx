import { type FC, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { isPendingSubscription, isValidSubscription } from '@tonkeeper/core/dist/entries/pro';

import { SubscriptionScreens } from '../enums/pro';
import {
    GoToContext,
    IScreenState,
    ScreenContext
} from '../components/create/SubscriptionFlowContext';
import { useProState } from '../state/pro';

interface IProps {
    children: ReactNode;
}

export const SubscriptionFlowProvider: FC<IProps> = ({ children }) => {
    const { data: proState } = useProState();
    const isStatusScreen =
        proState &&
        (isValidSubscription(proState.current) || isPendingSubscription(proState.current));

    const initialScreen = useMemo(() => {
        if (isStatusScreen) {
            return SubscriptionScreens.STATUS;
        }

        return SubscriptionScreens.ACCOUNTS;
    }, [proState?.current]);

    const [screen, setScreen] = useState<IScreenState | null>(null);

    const goTo = useCallback((nextScreen: SubscriptionScreens) => {
        setScreen(prevState => ({
            currentScreen: nextScreen,
            prevScreen: prevState?.currentScreen ?? null
        }));
    }, []);

    useEffect(() => {
        setScreen({
            currentScreen: initialScreen,
            prevScreen: null
        });
    }, [initialScreen]);

    if (!screen) return null;

    return (
        <ScreenContext.Provider value={screen}>
            <GoToContext.Provider value={goTo}>{children}</GoToContext.Provider>
        </ScreenContext.Provider>
    );
};
