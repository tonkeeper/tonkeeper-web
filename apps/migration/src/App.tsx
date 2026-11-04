import { FC } from 'react';

import { MigrationScreen } from './routing';
import { HandoffPopup } from './screens/HandoffPopup';
import { HomeScreenMoved } from './screens/HomeScreenMoved';
import { ManualRecovery } from './screens/ManualRecovery';
import { WeMoved } from './screens/WeMoved';

/** The outcomes that render; the rest are navigations taken in `index.tsx`. */
export type RenderedScreen = Extract<
    MigrationScreen,
    { kind: 'handoff-popup' | 'home-screen-moved' | 'manual-recovery' | 'we-moved' }
>;

export const App: FC<{ screen: RenderedScreen }> = ({ screen }) => {
    switch (screen.kind) {
        case 'handoff-popup':
            return (
                <HandoffPopup
                    hasWalletData={screen.hasWalletData}
                    canRecoverManually={screen.canRecoverManually}
                />
            );
        case 'home-screen-moved':
            return <HomeScreenMoved />;
        case 'manual-recovery':
            return <ManualRecovery />;
        case 'we-moved':
            return (
                <WeMoved
                    canRecoverManually={screen.canRecoverManually}
                    isHomeScreenApp={screen.isHomeScreenApp}
                />
            );
    }
};
