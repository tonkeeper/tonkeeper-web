import { useAppContext } from '../appContext';
import { useUserUIPreferences } from '../../state/theme';
import { useMemo } from 'react';

export const useMobileBannerUrl = () => {
    const { mainnetConfig } = useAppContext();
    const configLink = mainnetConfig.pro_mobile_app_appstore_link;
    const { data } = useUserUIPreferences();

    return useMemo(() => {
        if (!configLink || data === undefined || data?.dismissMobileQRBanner) {
            return null;
        }

        return configLink;
    }, [configLink, data]);
};
