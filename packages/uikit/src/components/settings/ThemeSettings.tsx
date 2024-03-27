import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { relative, SettingsRoute } from '../../libs/routes';
import { useUserThemes } from '../../state/theme';
import { MessageIcon, NotificationIcon } from '../Icon';
import { LocalizationIcon } from './SettingsIcons';
import { SettingsItem, SettingsList } from './SettingsList';

export const ThemeSettings = () => {
    const sdk = useAppSdk();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const { fiat } = useAppContext();
    const { data: themes } = useUserThemes();

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

        // TODO: REMOVE:
        items.push({
            name: i18n.language == 'ru' ? 'Обновление адреса' : 'Address Update',
            icon: 'EQ » UQ',
            action: () =>
                sdk.openPage(
                    i18n.language == 'ru'
                        ? 'https://t.me/tonkeeper_ru/65'
                        : 'https://t.me/tonkeeper_news/49'
                )
        });

        // if (themes && themes.length > 1) {
        //   items.push({
        //     name: t('Theme'),
        //     icon: <ThemeIcon />,
        //     action: () => navigate(relative(SettingsRoute.theme)),
        //   });
        // }

        return items;
    }, [t, i18n.enable, navigate, fiat, themes]);

    return <SettingsList items={secondaryItems} />;
};
