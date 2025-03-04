import { walletVersionText } from '@tonkeeper/core/dist/entries/wallet';
import { useMemo, useState } from 'react';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { SettingsRoute, WalletSettingsRoute, relative } from '../../libs/routes';
import { useJettonList } from '../../state/jetton';
import { useWalletNftList } from '../../state/nft';
import { useAccountsState, useActiveAccount } from '../../state/wallet';
import { useRenameNotification } from '../modals/RenameNotificationControlled';
import { WalletEmoji } from '../shared/emoji/WalletEmoji';
import { DeleteAccountNotification } from './DeleteAccountNotification';
import {
    AppsIcon,
    ListOfTokensIcon,
    LogOutIcon,
    RecoveryPhraseIcon,
    SaleBadgeIcon,
    SecurityIcon,
    SettingsProIcon,
    WalletsIcon,
    BatteryIcon,
    LockIcon
} from './SettingsIcons';
import { SettingsItem, SettingsList } from './SettingsList';
import {
    isAccountTonWalletStandard,
    isAccountVersionEditable,
    isMnemonicAndPassword
} from '@tonkeeper/core/dist/entries/account';
import { useBatteryEnabledConfig } from '../../state/battery';
import { useCanViewTwoFA } from '../../state/two-fa';
import { useNavigate } from '../../hooks/router/useNavigate';

const SingleAccountSettings = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const account = useActiveAccount();
    const { data: jettons } = useJettonList();
    const { data: nft } = useWalletNftList();
    const { proFeatures } = useAppContext();
    const { onOpen: rename } = useRenameNotification();
    const batteryEnableConfig = useBatteryEnabledConfig();
    const twoFAEnabled = useCanViewTwoFA();

    const mainItems = useMemo<SettingsItem[]>(() => {
        const items: SettingsItem[] = [];

        if (account.type === 'mnemonic' || account.type === 'mam') {
            items.push({
                name: t('settings_recovery_phrase'),
                icon: <RecoveryPhraseIcon />,
                action: () => navigate(relative(SettingsRoute.recovery))
            });
        }
        if (account.type === 'mam') {
            items.push({
                name: t('settings_backup_wallet'),
                icon: <RecoveryPhraseIcon />,
                action: () =>
                    navigate(
                        relative(
                            SettingsRoute.recovery +
                                '/' +
                                account.id +
                                '?wallet=' +
                                account.activeTonWallet.id
                        )
                    )
            });

            items.push({
                name: t('customize'),
                icon: <WalletEmoji containerSize="28px" emojiSize="28px" emoji={account.emoji} />,
                action: () =>
                    rename({
                        accountId: account.id,
                        derivationIndex: account.activeDerivation.index
                    })
            });

            items.push({
                name: t('settings_mam_indexes'),
                icon: `#${account.derivations.length.toString()}`,
                action: () => navigate(relative(WalletSettingsRoute.derivations))
            });
        }

        if (twoFAEnabled && (account.type === 'mnemonic' || account.type === 'mam')) {
            items.push({
                name: t('two_fa_long'),
                icon: <LockIcon />,
                action: () => navigate(relative(SettingsRoute.twoFa))
            });
        }

        if (
            account.type === 'mnemonic' ||
            account.type === 'testnet' ||
            account.type === 'ton-only'
        ) {
            items.push({
                name: t('settings_wallet_version'),
                icon: walletVersionText(account.activeTonWallet.version),
                action: () => navigate(relative(SettingsRoute.version))
            });
        }

        // check available derivations length to filter and keep only non-legacy added ledger accounts
        if (account.type === 'ledger' && account.allAvailableDerivations.length > 1) {
            items.push({
                name: t('settings_ledger_indexes'),
                icon: `# ${account.activeDerivationIndex + 1}`,
                action: () => navigate(relative(SettingsRoute.ledgerIndexes))
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
        if (isAccountTonWalletStandard(account)) {
            items.push({
                name: t('settings_connected_apps'),
                icon: <AppsIcon />,
                action: () => navigate(relative(WalletSettingsRoute.connectedApps))
            });
        }

        const canUseBattery = account.type === 'mnemonic' || account.type === 'mam';
        if (canUseBattery && !batteryEnableConfig.disableWhole) {
            items.push({
                name: t('battery_title'),
                icon: <BatteryIcon />,
                action: () => navigate(relative(WalletSettingsRoute.battery))
            });
        }

        return items;
    }, [t, navigate, account, jettons, nft, twoFAEnabled, batteryEnableConfig]);

    return (
        <>
            <SettingsList items={mainItems} />
        </>
    );
};

const MultipleAccountSettings = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { data: jettons } = useJettonList();
    const { data: nft } = useWalletNftList();
    const { proFeatures } = useAppContext();
    const account = useActiveAccount();
    const { onOpen: rename } = useRenameNotification();
    const batteryEnableConfig = useBatteryEnabledConfig();
    const twoFAEnabled = useCanViewTwoFA();

    const [deleteAccount, setDeleteAccount] = useState(false);

    const wallet = account.activeTonWallet;

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

        if (isMnemonicAndPassword(account)) {
            items.push({
                name: t('settings_recovery_phrase'),
                icon: <RecoveryPhraseIcon />,
                action: () => navigate(relative(SettingsRoute.recovery))
            });
        }
        if (account.type === 'mam') {
            items.push({
                name: t('settings_backup_wallet'),
                icon: <RecoveryPhraseIcon />,
                action: () =>
                    navigate(
                        relative(
                            SettingsRoute.recovery +
                                '/' +
                                account.id +
                                '?wallet=' +
                                account.activeTonWallet.id
                        )
                    )
            });

            items.push({
                name: t('customize'),
                icon: (
                    <WalletEmoji
                        containerSize="28px"
                        emojiSize="28px"
                        emoji={account.activeDerivation.emoji}
                    />
                ),
                action: () =>
                    rename({
                        accountId: account.id,
                        derivationIndex: account.activeDerivation.index
                    })
            });

            items.push({
                name: t('settings_mam_indexes'),
                icon: `#${account.derivations.length.toString()}`,
                action: () => navigate(relative(WalletSettingsRoute.derivations))
            });
        }

        if (twoFAEnabled && (account.type === 'mnemonic' || account.type === 'mam')) {
            items.push({
                name: t('two_fa_long'),
                icon: <LockIcon />,
                action: () => navigate(relative(SettingsRoute.twoFa))
            });
        }

        if (isAccountVersionEditable(account)) {
            items.push({
                name: t('settings_wallet_version'),
                icon: walletVersionText(account.activeTonWallet.version),
                action: () => navigate(relative(SettingsRoute.version))
            });
        }

        // check available derivations length to filter and keep only non-legacy added ledger accounts
        if (account.type === 'ledger' && account.allAvailableDerivations.length > 1) {
            items.push({
                name: t('settings_ledger_indexes'),
                icon: `# ${account.activeDerivationIndex + 1}`,
                action: () => navigate(relative(SettingsRoute.ledgerIndexes))
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
        if (isAccountTonWalletStandard(account)) {
            items.push({
                name: t('settings_connected_apps'),
                icon: <AppsIcon />,
                action: () => navigate(relative(WalletSettingsRoute.connectedApps))
            });
        }

        const canUseBattery = account.type === 'mnemonic' || account.type === 'mam';
        if (canUseBattery && !batteryEnableConfig.disableWhole) {
            items.push({
                name: t('battery_title'),
                icon: <BatteryIcon />,
                action: () => navigate(relative(WalletSettingsRoute.battery))
            });
        }

        items.push({
            name: t('Delete_wallet_data'),
            icon: <LogOutIcon />,
            action: () => setDeleteAccount(true)
        });
        return items;
    }, [t, navigate, wallet, account, jettons, nft, twoFAEnabled, batteryEnableConfig]);

    return (
        <>
            <SettingsList items={accountItems} />
            <SettingsList items={mainItems} />
            <DeleteAccountNotification
                account={deleteAccount ? account : undefined}
                handleClose={() => setDeleteAccount(false)}
            />
        </>
    );
};

export const AccountSettings = () => {
    const accounts = useAccountsState();

    if (accounts.length > 1) {
        return <MultipleAccountSettings />;
    } else {
        return <SingleAccountSettings />;
    }
};
