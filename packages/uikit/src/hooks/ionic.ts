import { useMemo } from 'react';

export const useMenuController = (type: 'aside-nav' | 'wallet-nav') => {
    return useMemo(() => {
        return {
            open: () => {
                const menu = document.querySelector(
                    `ion-menu[menu-id="${type}"]`
                ) as HTMLIonMenuElement | null;
                return menu?.open();
            },
            close: () => {
                const menu = document.querySelector(
                    `ion-menu[menu-id="${type}"]`
                ) as HTMLIonMenuElement | null;
                return menu?.close();
            }
        };
    }, [type]);
};
