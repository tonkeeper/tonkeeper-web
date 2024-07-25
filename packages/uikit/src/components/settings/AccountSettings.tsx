import { isStandardTonWallet, walletVersionText } from '@tonkeeper/core/dist/entries/wallet';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { SettingsRoute, relative, WalletSettingsRoute } from '../../libs/routes';
import { useJettonList } from '../../state/jetton';
import { LogOutAccountNotification } from './LogOutNotification';
import {
    AppsIcon,
    ListOfTokensIcon,
    LogOutIcon,
    SaleBadgeIcon,
    SecurityIcon,
    SettingsProIcon,
    WalletsIcon
} from './SettingsIcons';
import { SettingsItem, SettingsList } from './SettingsList';
import { useActiveWallet, useAccountsState, useActiveAccount } from '../../state/wallet';
import { useWalletNftList } from '../../state/nft';

const SingleAccountSettings = () => {
    const [logout, setLogout] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const account = useActiveAccount();
    const wallet = account.activeTonWallet;
    const { data: jettons } = useJettonList();
    const { data: nft } = useWalletNftList();
    const { proFeatures } = useAppContext();
    const mainItems = useMemo<SettingsItem[]>(() => {
        const items: SettingsItem[] = [
            // {
            //   name: t('Subscriptions'),
            //   icon: <SubscriptionIcon />,
            //   action: () => navigate(relative(SettingsRoute.subscriptions)),
            // },
        ];

        /*        if (wallet.auth == null) {
            items.push({
                name: t('settings_recovery_phrase'),
                icon: <RecoveryPhraseIcon />,
                action: () => navigate(relative(SettingsRoute.recovery))
            });
        }*/

        if (account.type === 'mnemonic') {
            items.push({
                name: t('settings_wallet_version'),
                icon: walletVersionText(wallet.version),
                action: () => navigate(relative(SettingsRoute.version))
            });
        }

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

        if (nft?.length) {
            items.push({
                name: t('settings_collectibles_list'),
                icon: <SaleBadgeIcon />,
                action: () => navigate(relative(SettingsRoute.nft))
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
    }, [t, navigate, account, jettons, nft]);

    return (
        <>
            <SettingsList items={mainItems} />
            <LogOutAccountNotification
                account={logout ? account : undefined}
                handleClose={() => setLogout(false)}
            />
        </>
    );
};

const MultipleAccountSettings = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const wallet = useActiveWallet();

    const { data: jettons } = useJettonList();
    const { data: nft } = useWalletNftList();
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

        /*if (wallet.auth == null) {
            items.push({
                name: t('settings_recovery_phrase'),
                icon: <RecoveryPhraseIcon />,
                action: () => navigate(relative(SettingsRoute.recovery))
            });
        }*/

        if (isStandardTonWallet(wallet)) {
            items.push({
                name: t('settings_wallet_version'),
                icon: walletVersionText(wallet.version),
                action: () => navigate(relative(SettingsRoute.version))
            });
        }

        if (jettons?.balances.length) {
            items.push({
                name: t('settings_jettons_list'),
                icon: <ListOfTokensIcon />,
                action: () => navigate(relative(SettingsRoute.jettons))
            });
        }

        if (nft?.length) {
            items.push({
                name: t('settings_collectibles_list'),
                icon: <SaleBadgeIcon />,
                action: () => navigate(relative(SettingsRoute.nft))
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
    }, [t, navigate, wallet, jettons, nft]);

    return (
        <>
            <SettingsList items={accountItems} />
            <SettingsList items={mainItems} />
        </>
    );
};

export const AccountSettings = () => {
    const wallets = useAccountsState();

    if (wallets.length > 1) {
        return <MultipleAccountSettings />;
    } else {
        return <SingleAccountSettings />;
    }
};
