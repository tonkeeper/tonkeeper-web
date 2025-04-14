import { useEffect, useMemo, useState } from 'react';

export const useMenuController = (type: 'aside-nav' | 'wallet-nav') => {
    const getMenu = () =>
        document.querySelector(`ion-menu[menu-id="${type}"]`) as HTMLIonMenuElement | null;

    useEffect(() => {
        const menu = getMenu();

        const onMenuOpened = () => setIsOpen(true);
        const onMenuClosed = () => setIsOpen(false);

        menu?.addEventListener('ionWillOpen', onMenuOpened);
        menu?.addEventListener('ionWillClose', onMenuClosed);
        return () => {
            menu?.removeEventListener('ionWillOpen', onMenuOpened);
            menu?.removeEventListener('ionWillClose', onMenuClosed);
        };
    }, []);

    const [isOpen, setIsOpen] = useState(!!getMenu()?.classList.contains('show-menu'));

    return useMemo(() => {
        return {
            open: () => getMenu()?.open(),
            close: () => getMenu()?.close(),
            isOpen
        };
    }, [type, isOpen]);
};

const getDialog = () => {
    const host = document.querySelector('ion-modal.modal-card');
    const shadowRoot = host?.shadowRoot;
    const dialog = shadowRoot?.querySelector('div[role=dialog]') as HTMLElement | null;
    const existingStyle = shadowRoot?.querySelector('style[data-style="locked-transform"]');

    if (dialog && !existingStyle) {
        const style = document.createElement('style');
        style.setAttribute('data-style', 'locked-transform');
        style.textContent = `
            .locked-transform {
              --fixed-transform: none;
              transform: var(--fixed-transform) !important;
            }
        `;
        shadowRoot!.appendChild(style);
    }

    return dialog;
};
const getRouters = () => [...document.querySelectorAll('ion-router-outlet')];

export const cardModalSwipe = {
    lock() {
        getRouters().forEach(r => {
            const computed = getComputedStyle(r).transform;
            r.style.setProperty('--fixed-transform', computed);
            r.classList.add('locked-transform');
        });

        const dialog = getDialog();
        if (dialog) {
            dialog.style.setProperty('--fixed-transform', 'none');
            dialog.classList.add('locked-transform');
        }
    },

    unlock() {
        getRouters().forEach(r => {
            r.classList.remove('locked-transform');
            r.style.removeProperty('--fixed-transform');
        });

        const dialog = getDialog();
        if (dialog) {
            dialog.classList.remove('locked-transform');
            dialog.style.removeProperty('--fixed-transform');
        }
    }
};
