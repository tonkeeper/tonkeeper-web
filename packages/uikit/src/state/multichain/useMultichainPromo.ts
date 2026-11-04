import { useCallback, useEffect, useRef, useState } from 'react';
import { AppKey } from '@tonkeeper/core/dist/Keys';

import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useAddWalletFlow } from '../../components/modals/AddWalletFlow';
import { useAccountsStateQuery } from '../wallet';

/**
 * The one-time "multichain wallets are here" promo for installs that hold
 * only legacy TON wallets. Spent the moment it appears, so closing the app
 * with it open doesn't bring it back.
 *
 * Gated on `multichainEnabled` for the same reason as the add-wallet
 * tooltip: with the flag off, neither create nor import produces a
 * multichain wallet. Held back while the add-wallet flow is open so it
 * never stacks on top of a create or import in progress.
 */
export const useMultichainPromo = () => {
    const sdk = useAppSdk();
    const { multichainEnabled } = useAppContext();
    // The query form: shell chrome can mount before the accounts query
    // resolves, and `useAccountsState()` asserts on its data.
    const { data: accounts } = useAccountsStateQuery();
    const addWallet = useAddWalletFlow();
    const eligible =
        multichainEnabled &&
        !!accounts?.length &&
        accounts.every(a => a.type !== 'multichain') &&
        !addWallet.isOpen;

    const [visible, setVisible] = useState(false);
    const attemptedRef = useRef(false);

    useEffect(() => {
        if (!eligible || attemptedRef.current) return;
        let cancelled = false;
        sdk.storage.get<boolean>(AppKey.MULTICHAIN_PROMO_SHOWN).then(shown => {
            if (cancelled) return;
            attemptedRef.current = true;
            if (shown) return;
            setVisible(true);
            void sdk.storage.set<boolean>(AppKey.MULTICHAIN_PROMO_SHOWN, true);
        });
        return () => {
            cancelled = true;
        };
    }, [eligible, sdk]);

    const dismiss = useCallback(() => setVisible(false), []);

    // The full picker, not straight into create: the user may already hold a
    // multichain wallet elsewhere and want to import it.
    const { onOpen: openAddWallet } = addWallet;
    const tryMultichain = useCallback(() => {
        setVisible(false);
        void openAddWallet();
    }, [openAddWallet]);

    return { isOpen: visible && eligible, dismiss, tryMultichain };
};
