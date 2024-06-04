import { walletVersionText } from '@tonkeeper/core/dist/entries/wallet';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { SettingsRoute, relative, WalletSettingsRoute } from '../../libs/routes';
import { useWalletJettonList } from '../../state/wallet';
import { LogOutWalletNotification } from './LogOutNotification';
import {
    AppsIcon,
    ListOfTokensIcon,
    LogOutIcon,
    RecoveryPhraseIcon,
    SecurityIcon,
    SettingsProIcon,
    WalletsIcon
} from './SettingsIcons';
import { SettingsItem, SettingsList } from './SettingsList';

const SingleAccountSettings = () => {
    const [logout, setLogout] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const wallet = useWalletContext();
    const { data: jettons } = useWalletJettonList();
    const { proFeatures } = useAppContext();
    const mainItems = useMemo<SettingsItem[]>(() => {
        const items: SettingsItem[] = [
            // {
            //   name: t('Subscriptions'),
            //   icon: <SubscriptionIcon />,
            //   action: () => navigate(relative(SettingsRoute.subscriptions)),
            // },
        ];

        if (wallet.auth == null) {
            items.push({
                name: t('settings_recovery_phrase'),
                icon: <RecoveryPhraseIcon />,
                action: () => navigate(relative(SettingsRoute.recovery))
            });
        }

        items.push({
            name: t('settings_wallet_version'),
            icon: walletVersionText(wallet.active.version),
            action: () => navigate(relative(SettingsRoute.version))
        });

        if (proFeatures) {
            items.unshift({
                name: t('tonkeeper_pro'),
                icon: <SettingsProIcon />,
                action: () => navigate(relative(SettingsRoute.pro))
            });
        }

        if (jettons?.balances.length) {
            items.push({
                name: t('settings_jettons_list'),
                icon: <ListOfTokensIcon />,
                action: () => navigate(relative(SettingsRoute.jettons))
            });
        }

        items.push({
            name: t('settings_security'),
            icon: <SecurityIcon />,
            action: () => navigate(relative(SettingsRoute.security))
        });
        items.push({
            name: t('settings_connected_apps'),
            icon: <AppsIcon />,
            action: () => navigate(relative(WalletSettingsRoute.connectedApps))
        });
        items.push({
            name: t('settings_reset'),
            icon: <LogOutIcon />,
            action: () => setLogout(true)
        });

        return items;
    }, [t, navigate, wallet, jettons]);

    return (
        <>
            <SettingsList items={mainItems} />
            <LogOutWalletNotification
                wallet={logout ? wallet : undefined}
                handleClose={() => setLogout(false)}
            />
        </>
    );
};

const MultipleAccountSettings = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const wallet = useWalletContext();

    const { data: jettons } = useWalletJettonList();
    const { proFeatures } = useAppContext();

    const accountItems = useMemo(() => {
        const items: SettingsItem[] = [
            {
                name: t('Manage_wallets'),
                icon: <WalletsIcon />,
                action: () => navigate(relative(SettingsRoute.account))
            }
            // {
            //   name: t('Subscriptions'),
            //   icon: <SubscriptionIcon />,
            //   action: () => navigate(relative(SettingsRoute.subscriptions)),
            // },
        ];

        if (proFeatures) {
            items.push({
                name: t('tonkeeper_pro'),
                icon: <SettingsProIcon />,
                action: () => navigate(relative(SettingsRoute.pro))
            });
        }

        return items;
    }, [wallet, t]);

    const mainItems = useMemo<SettingsItem[]>(() => {
        const items: SettingsItem[] = [];

        if (wallet.auth == null) {
            items.push({
                name: t('settings_recovery_phrase'),
                icon: <RecoveryPhraseIcon />,
                action: () => navigate(relative(SettingsRoute.recovery))
            });
        }

        items.push({
            name: t('settings_wallet_version'),
            icon: walletVersionText(wallet.active.version),
            action: () => navigate(relative(SettingsRoute.version))
        });

        if (jettons?.balances.length) {
            items.push({
                name: t('settings_jettons_list'),
                icon: <ListOfTokensIcon />,
                action: () => navigate(relative(SettingsRoute.jettons))
            });
        }
        items.push({
            name: t('settings_security'),
            icon: <SecurityIcon />,
            action: () => navigate(relative(SettingsRoute.security))
        });
        items.push({
            name: t('settings_connected_apps'),
            icon: <AppsIcon />,
            action: () => navigate(relative(WalletSettingsRoute.connectedApps))
        });
        return items;
    }, [t, navigate, wallet, jettons]);

    return (
        <>
            <SettingsList items={accountItems} />
            <SettingsList items={mainItems} />
        </>
    );
};

export const AccountSettings = () => {
    const { account } = useAppContext();

    if (account.publicKeys.length > 1) {
        return <MultipleAccountSettings />;
    } else {
        return <SingleAccountSettings />;
    }
};
