import { FC } from 'react';
import { AppContext, useAppContext } from '../../hooks/appContext';
import { EnterAmountScreen, EnterAmountScreenProps } from './EnterAmountScreen';

/**
 * The swaps client needs an absolute base URL, and the shared CT config has
 * none. Pointing it at the page's own origin keeps the quote request
 * same-origin, so a `page.route` answer reaches the screen without CORS.
 */
export const EnterAmountScreenWithSwapsHarness: FC<EnterAmountScreenProps> = props => {
    const context = useAppContext();
    const webSwapsUrl = window.location.origin;
    return (
        <AppContext.Provider
            value={{
                ...context,
                mainnetConfig: { ...context.mainnetConfig, web_swaps_url: webSwapsUrl },
                testnetConfig: { ...context.testnetConfig, web_swaps_url: webSwapsUrl }
            }}
        >
            <EnterAmountScreen {...props} />
        </AppContext.Provider>
    );
};
