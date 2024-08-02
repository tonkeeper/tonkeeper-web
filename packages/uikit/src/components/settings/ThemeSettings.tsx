import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { relative, SettingsRoute } from '../../libs/routes';
import { MessageIcon, NotificationIcon } from '../Icon';
import { LocalizationIcon } from './SettingsIcons';
import { SettingsItem, SettingsList } from './SettingsList';

export const ThemeSettings = () => {
    const sdk = useAppSdk();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const { fiat } = useAppContext();

    const secondaryItems = useMemo(() => {
        const items: SettingsItem[] = [];

        if (sdk.notifications) {
            items.push({
                name: t('settings_notifications'),
                icon: <NotificationIcon />,
                action: () => navigate(relative(SettingsRoute.notification))
            });
        }
        items.push({
            name: t('settings_primary_currency'),
            icon: fiat,
            action: () => navigate(relative(SettingsRoute.fiat))
        });

        if (i18n.enable) {
            items.push({
                name: t('Localization'),
                icon: <MessageIcon />,
                action: () => navigate(relative(SettingsRoute.localization))
            });
        }

        items.push({
            name: t('country'),
            icon: <LocalizationIcon />,
            action: () => navigate(relative(SettingsRoute.country))
        });
        return items;
    }, [t, i18n.enable, navigate, fiat]);

    return <SettingsList items={secondaryItems} />;
};
