import { type FC, type ReactNode, useState } from 'react';

import { SubscriptionScreens } from '../enums/pro';
import { GoToContext, ScreenContext } from '../components/create/SubscriptionFlowContext';

interface IProps {
    children: ReactNode;
}

export const SubscriptionFlowProvider: FC<IProps> = ({ children }) => {
    const [screen, setScreen] = useState<SubscriptionScreens>(SubscriptionScreens.ACCOUNTS);

    return (
        <ScreenContext.Provider value={screen}>
            <GoToContext.Provider value={setScreen}>{children}</GoToContext.Provider>
        </ScreenContext.Provider>
    );
};
