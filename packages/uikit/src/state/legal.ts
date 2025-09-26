import { useAppSdk } from '../hooks/appSdk';
import { useAppContext } from '../hooks/appContext';

export const useLegalLinks = () => {
    const sdk = useAppSdk();
    const { mainnetConfig } = useAppContext();

    const privacyLink = mainnetConfig?.privacy_policy;
    const proTermsLink = mainnetConfig.pro_terms_of_use;
    const usualTermsLink = mainnetConfig?.terms_of_use;

    const shouldUseProTerms = !!sdk.subscriptionService;

    return {
        termsLink: shouldUseProTerms ? proTermsLink : usualTermsLink,
        privacyLink
    };
};
