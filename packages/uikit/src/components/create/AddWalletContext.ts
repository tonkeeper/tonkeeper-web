import { createContext } from 'react';
import type { AddWalletSource } from '../../hooks/analytics/wallet-flow';

export const AddWalletContext = createContext<{
    navigateHome: (() => void) | undefined;
    /** Which surface the add-wallet flow was opened from, for the funnel events. */
    analyticsFrom: AddWalletSource;
}>({
    navigateHome: () => {},
    analyticsFrom: 'main'
});
