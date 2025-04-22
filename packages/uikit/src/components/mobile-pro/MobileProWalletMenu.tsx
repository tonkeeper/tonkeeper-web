import { WalletAsideMenu } from '../desktop/aside/WalletAsideMenu';
import { IonMenu } from '@ionic/react';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { useAtom } from '../../libs/useAtom';
import { AppProRoute, AppRoute } from '../../libs/routes';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

const isProWalletMenuOpen$ = atom(false);

export const useIsProWalletMenuOpened = () => useAtom(isProWalletMenuOpen$);

const disableMenuForRoutes = [AppRoute.browser, AppProRoute.dashboard];

export const MobileProWalletMenu = () => {
    const [_, setIsOpen] = useIsProWalletMenuOpened();
    const location = useLocation();
    const shouldDisableMenu = useMemo(
        () => disableMenuForRoutes.some(path => location.pathname.startsWith(path)),
        [location.pathname]
    );

    return (
        <IonMenu
            menuId="wallet-nav"
            contentId="main-content"
            side="end"
            type="overlay"
            onIonDidClose={() => setIsOpen(false)}
            onIonWillOpen={() => setIsOpen(true)}
            swipeGesture
            disabled={shouldDisableMenu}
        >
            <WalletAsideMenu />
        </IonMenu>
    );
};
