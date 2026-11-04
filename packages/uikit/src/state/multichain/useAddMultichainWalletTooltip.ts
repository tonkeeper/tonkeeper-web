import { useCallback, useEffect, useRef, useState } from 'react';
import { AppKey } from '@tonkeeper/core/dist/Keys';

import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useAccountsStateQuery } from '../wallet';

interface AddWalletTooltipState {
    shownCount: number;
    /** `Date#toDateString()` of the last show — a calendar day, not an instant. */
    lastShownDay: string;
}

const MAX_TOTAL_SHOWS = 3;

const currentDay = () => new Date().toDateString();

/**
 * The "Add a wallet for new blockchains" nudge on the add-wallet control,
 * for installs that hold no multichain account yet. Same budget as the
 * natives: at most once per calendar day and three times in all, spent
 * the moment the bubble appears. Any press — on the bubble, on the control
 * it points at, or elsewhere — closes it until the next eligible day.
 *
 * Gated on `multichainEnabled` because the nudge is about what "Add
 * Wallet" creates: with the flag off the control still produces a TON-only
 * wallet and the promise would be false.
 */
export const useAddMultichainWalletTooltip = () => {
    const sdk = useAppSdk();
    const { multichainEnabled } = useAppContext();
    // The query form: the sidebar chrome can mount before the accounts
    // query resolves, and `useAccountsState()` asserts on its data.
    const { data: accounts } = useAccountsStateQuery();
    const eligible =
        multichainEnabled && !!accounts && accounts.every(a => a.type !== 'multichain');

    const [visible, setVisible] = useState(false);
    const attemptedRef = useRef(false);

    useEffect(() => {
        if (!eligible || attemptedRef.current) return;
        attemptedRef.current = true;
        let cancelled = false;
        sdk.storage
            .get<AddWalletTooltipState>(AppKey.MULTICHAIN_ADD_WALLET_TOOLTIP_STATE)
            .then(state => {
                if (cancelled) return;
                const shownCount = state?.shownCount ?? 0;
                const day = currentDay();
                if (shownCount >= MAX_TOTAL_SHOWS || state?.lastShownDay === day) return;
                setVisible(true);
                void sdk.storage.set<AddWalletTooltipState>(
                    AppKey.MULTICHAIN_ADD_WALLET_TOOLTIP_STATE,
                    { shownCount: shownCount + 1, lastShownDay: day }
                );
            });
        return () => {
            cancelled = true;
        };
    }, [eligible, sdk]);

    const dismiss = useCallback(() => setVisible(false), []);

    return { visible: visible && eligible, dismiss };
};
