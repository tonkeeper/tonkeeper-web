import { type FC, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { PurchaseSubscriptionScreens } from '../enums/pro';
import {
    GoToPurchaseContext,
    IPurchaseScreenState,
    PurchaseScreenContext
} from '../components/create/SubscriptionPurchaseContext';
import { useProState } from '../state/pro';

interface IProps {
    onClose: () => void;
    children: ReactNode;
}

export const SubscriptionPurchaseProvider: FC<IProps> = ({ children, onClose }) => {
    const { data: proState } = useProState();
    // const isStatusScreen =
    //     proState &&
    //     (isValidSubscription(proState.current) || isPendingSubscription(proState.current));

    const initialScreen = useMemo(() => {
        // if (isStatusScreen) {
        //     return PurchaseSubscriptionScreens.STATUS;
        // }

        return PurchaseSubscriptionScreens.PROMO;
    }, [proState?.current]);

    const [screen, setScreen] = useState<IPurchaseScreenState | null>(null);

    const goTo = useCallback((nextScreen: PurchaseSubscriptionScreens) => {
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

    const controlValue = useMemo(() => ({ goTo, onClose }), [goTo, onClose]);

    if (!screen) return null;

    return (
        <PurchaseScreenContext.Provider value={screen}>
            <GoToPurchaseContext.Provider value={controlValue}>
                {children}
            </GoToPurchaseContext.Provider>
        </PurchaseScreenContext.Provider>
    );
};
