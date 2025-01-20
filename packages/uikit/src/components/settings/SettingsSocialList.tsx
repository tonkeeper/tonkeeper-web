import React, { FC, useMemo } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { SettingsRoute, relative } from '../../libs/routes';
import { ContactSupportIcon, LegalDocumentsIcon, TelegramIcon } from './SettingsIcons';
import { SettingsItem, SettingsList } from './SettingsList';
import { useActiveConfig } from '../../state/wallet';
import { useNavigate } from '../../hooks/router/useNavigate';

export const SettingsSocialList: FC = React.memo(() => {
    const navigate = useNavigate();
    const sdk = useAppSdk();
    const config = useActiveConfig();

    const { t } = useTranslation();
    const items = useMemo(() => {
        const result = [] as SettingsItem[];
        return result.concat([
            {
                name: t('settings_support'),
                icon: <TelegramIcon />,
                action: () => config.directSupportUrl && sdk.openPage(config.directSupportUrl)
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
