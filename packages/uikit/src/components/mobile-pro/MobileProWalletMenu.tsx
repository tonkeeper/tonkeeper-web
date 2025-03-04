import { IonMenu } from '@ionic/react';
import { WalletAsideMenu } from '../desktop/aside/WalletAsideMenu';
import { atom, useAtom } from '../../libs/atom';
import styled from 'styled-components';

const IonMenuStyled = styled(IonMenu)`
    &::part(container) {
        padding-top: env(safe-area-inset-top);
    }
`;

const isProWalletMenuOpen$ = atom(false);

export const useIsProWalletMenuOpened = () => useAtom(isProWalletMenuOpen$);

export const MobileProWalletMenu = () => {
    const [_, setIsOpen] = useIsProWalletMenuOpened();

    return (
        <IonMenuStyled
            menuId="wallet-nav"
            contentId="main-content"
            side="end"
            onIonDidClose={() => setIsOpen(false)}
            onIonWillOpen={() => setIsOpen(true)}
        >
            <WalletAsideMenu />
        </IonMenuStyled>
    );
};
