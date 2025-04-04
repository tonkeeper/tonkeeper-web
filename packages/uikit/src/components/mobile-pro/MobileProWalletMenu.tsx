import { WalletAsideMenu } from '../desktop/aside/WalletAsideMenu';
import { IonMenu } from '@ionic/react';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { useAtom } from '../../libs/useAtom';

const isProWalletMenuOpen$ = atom(false);

export const useIsProWalletMenuOpened = () => useAtom(isProWalletMenuOpen$);

export const MobileProWalletMenu = () => {
    const [_, setIsOpen] = useIsProWalletMenuOpened();

    return (
        <IonMenu
            menuId="wallet-nav"
            contentId="main-content"
            side="end"
            type="push"
            onIonDidClose={() => setIsOpen(false)}
            onIonWillOpen={() => setIsOpen(true)}
        >
            <WalletAsideMenu />
        </IonMenu>
    );
};
