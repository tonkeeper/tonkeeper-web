import { useAppSdk } from '../hooks/appSdk';
import { useAppContext } from '../hooks/appContext';

export const useLegalLinks = () => {
    const sdk = useAppSdk();
    const { mainnetConfig } = useAppContext();

    const privacyLink = mainnetConfig?.privacy_policy ?? 'https://tonkeeper.com/privacy';
    const proTermsLink = mainnetConfig?.pro_terms_of_use ?? 'https://tonkeeper.com/pro-terms';
    const usualTermsLink = mainnetConfig?.terms_of_use ?? 'https://tonkeeper.com/terms';

    const shouldUseProTerms = !!sdk.subscriptionStrategy;

    return {
        termsLink: shouldUseProTerms ? proTermsLink : usualTermsLink,
        privacyLink
    };
};
