import React, { FC, useMemo } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { SettingsRoute, relative } from '../../libs/routes';
import {
    ContactSupportIcon,
    LegalDocumentsIcon,
    TelegramIcon,
    StarIcon,
    AppleIcon
} from './SettingsIcons';
import { SettingsItem, SettingsList } from './SettingsList';
import { useActiveConfig } from '../../state/wallet';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useProSupportUrl } from '../../state/pro';

export const SettingsSocialList: FC = React.memo(() => {
    const navigate = useNavigate();
    const sdk = useAppSdk();
    const config = useActiveConfig();
    const { data: prioritySupportUrl } = useProSupportUrl();

    const { t } = useTranslation();
    const items = useMemo(() => {
        const result = [] as SettingsItem[];

        if (sdk.storeUrl) {
            result.push({
                name: t('settings_rate'),
                icon: <StarIcon />,
                action: () => sdk.storeUrl && sdk.openPage(sdk.storeUrl)
            });
        }

        return result.concat([
            {
                name: t(prioritySupportUrl ? 'priority_support' : 'settings_support'),
                icon: <TelegramIcon />,
                action: () =>
                    config.directSupportUrl &&
                    sdk.openPage(prioritySupportUrl ? prioritySupportUrl : config.directSupportUrl)
            },
            {
                name: t('settings_pro_ios'),
                icon: <AppleIcon />,
                action: () =>
                    config.pro_mobile_app_appstore_link &&
                    sdk.openPage(config.pro_mobile_app_appstore_link)
            },
            {
                name: t('settings_news'),
                icon: <TelegramIcon />,
                action: () => config.tonkeeperNewsUrl && sdk.openPage(config.tonkeeperNewsUrl)
            },
            {
                name: t('settings_contact_support'),
                icon: <ContactSupportIcon />,
                action: () => config.supportLink && sdk.openPage(config.supportLink)
            },
            {
                name: t('settings_legal_documents'),
                icon: <LegalDocumentsIcon />,
                action: () => navigate(relative(SettingsRoute.legal))
            }
        ]);
    }, [t, navigate, sdk.openPage]);

    return <SettingsList items={items} />;
});
