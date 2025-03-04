import { useLocation } from 'react-router-dom';
import { AppRoute, SettingsRoute } from '../../../libs/routes';
import { useTranslation } from '../../../hooks/translation';
import { MobileProHeaderContentSimple } from './MobileProHeaderElements';

const translationKeys = {
    [SettingsRoute.account]: 'Manage_wallets',
    [SettingsRoute.localization]: 'Localization',
    [SettingsRoute.legal]: 'legal_header_title',
    [SettingsRoute.theme]: 'Theme',
    [SettingsRoute.dev]: 'Dev Menu',
    [SettingsRoute.fiat]: 'settings_primary_currency',
    [SettingsRoute.security]: 'settings_security',
    [SettingsRoute.country]: 'country',
    [SettingsRoute.pro]: 'tonkeeper_pro'
};

export const MobileProPreferencesHeader = () => {
    const location = useLocation();
    const { t } = useTranslation();

    if (location.pathname === AppRoute.settings) {
        return <MobileProHeaderContentSimple>{t('aside_settings')}</MobileProHeaderContentSimple>;
    }

    const currentPath = location.pathname.replace(new RegExp(`^${AppRoute.settings}`), '');

    const pathKey = Object.keys(translationKeys).find(k => currentPath.startsWith(k)) as
        | keyof typeof translationKeys
        | undefined;
    const translationKey = pathKey ? translationKeys[pathKey] : 'aside_settings';

    return <MobileProHeaderContentSimple>{t(translationKey)}</MobileProHeaderContentSimple>;
};
