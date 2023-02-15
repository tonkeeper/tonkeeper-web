import React, { FC, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { relative, SettingsRoute } from '../../libs/routes';
import {
  ContactSupportIcon,
  LegalDocumentsIcon,
  TelegramIcon,
} from './SettingsIcons';
import { SettingsItem, SettingsList } from './SettingsList';

export interface SettingsSocialProps {
  appPage?: string;
}

export const SettingsSocialList: FC = React.memo(() => {
  const navigate = useNavigate();
  const sdk = useAppSdk();
  const { t } = useTranslation();
  const items = useMemo(() => {
    const result = [] as SettingsItem[];
    return result.concat([
      {
        name: t('settings_contact_support'),
        icon: <ContactSupportIcon />,
        action: () => sdk.openPage('mailto:support@tonkeeper.com'),
      },
      {
        name: t('settings_news'),
        icon: <TelegramIcon />,
        action: () => sdk.openPage(t('settings_news_url')),
      },
      {
        name: t('settings_support'),
        icon: <TelegramIcon />,
        action: () => sdk.openPage(t('settings_news_url_discuss')),
      },
      {
        name: t('settings_legal_documents'),
        icon: <LegalDocumentsIcon />,
        action: () => navigate(relative(SettingsRoute.legal)),
      },
    ]);
  }, [t, navigate, sdk.openPage]);

  return <SettingsList items={items} />;
});
