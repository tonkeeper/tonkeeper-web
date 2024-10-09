import { createContext } from 'react';

export const AddWalletContext = createContext<{ navigateHome: (() => void) | undefined }>({
    navigateHome: () => {}
});
