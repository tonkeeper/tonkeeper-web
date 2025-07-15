import { type FC, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { PurchaseSubscriptionScreens } from '../enums/pro';
import {
    PurchaseControlContext,
    IPurchaseScreenState,
    PurchaseScreenContext
} from '../components/create/SubscriptionPurchaseContext';

interface IProps {
    onClose: () => void;
    children: ReactNode;
    initialScreen: PurchaseSubscriptionScreens | undefined;
}

export const SubscriptionPurchaseProvider: FC<IProps> = props => {
    const { children, onClose, initialScreen } = props;

    const [screen, setScreen] = useState<IPurchaseScreenState | null>(null);

    const goTo = useCallback((nextScreen: PurchaseSubscriptionScreens) => {
        setScreen(prevState => ({
            currentScreen: nextScreen,
            prevScreen: prevState?.currentScreen ?? null
        }));
    }, []);

    useEffect(() => {
        setScreen({
            currentScreen: initialScreen ?? PurchaseSubscriptionScreens.PROMO,
            prevScreen: null
        });
    }, []);

    const controlValue = useMemo(() => ({ goTo, onClose }), [goTo, onClose]);

    if (!screen) return null;

    return (
        <PurchaseScreenContext.Provider value={screen}>
            <PurchaseControlContext.Provider value={controlValue}>
                {children}
            </PurchaseControlContext.Provider>
        </PurchaseScreenContext.Provider>
    );
};
