import { FC, useState } from 'react';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { addableMultichainTonVersion } from '@tonkeeper/core/dist/service/multichainCreateService';

import { useAppContext } from '../../../../hooks/appContext';
import { useAppSdk } from '../../../../hooks/appSdk';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { getLanguageName } from '../../../../libs/common';
import { MultichainRoute, MultichainSettingsRoute } from '../../../../libs/routes';
import {
    useAccountsState,
    useActiveAccount,
    useActiveConfig,
    useAddMultichainTonVersion
} from '../../../../state/wallet';
import { useToastMutationError } from '../../../../hooks/useNotification';
import { useGlobalPreferences } from '../../../../state/global-preferences';
import { useIsOnIosReview } from '../../../../hooks/ios';
import { useCanSeeBattery } from '../../../../state/battery';
import IcApps28 from '../../../../icons/components/IcApps28';
import IcBattery28 from '../../../../icons/components/IcBattery28';
import IcBell28 from '../../../../icons/components/IcBell28';
import IcDoc28 from '../../../../icons/components/IcDoc28';
import IcDoor28 from '../../../../icons/components/IcDoor28';
import IcKey28 from '../../../../icons/components/IcKey28';
import IcLock28 from '../../../../icons/components/IcLock28';
import IcMessageBubble28 from '../../../../icons/components/IcMessageBubble28';
import IcQuestion28 from '../../../../icons/components/IcQuestion28';
import IcStar28 from '../../../../icons/components/IcStar28';
import IcTelegram28 from '../../../../icons/components/IcTelegram28';
import IcTrashBin28 from '../../../../icons/components/IcTrashBin28';
import IcTrayArrowDown28 from '../../../../icons/components/IcTrayArrowDown28';
import IcWallet28 from '../../../../icons/components/IcWallet28';
import { WalletEmoji } from '../../../../components/shared/emoji/WalletEmoji';
import {
    useHasMigrationSourceWallets,
    useIsMigrationOpened,
    useMarkMigrationOpened
} from '../../../../state/multichain/useMigration';
import { INTERCEPT_LINKS_OPTION_TITLES } from './SettingsInterceptLinksPage';
import { SettingsListCell, SettingsListGroup } from './SettingsList';
import { SettingsPageLayout } from './SettingsPageLayout';
import { SettingsVersionFooter } from './SettingsVersionFooter';
import { SupportSheet } from './SupportSheet';
import { SignOutSheet } from './SignOutSheet';
import { DeleteAccountSheet } from './DeleteAccountSheet';

const Group: FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="px-4 pb-4">
        <SettingsListGroup>{children}</SettingsListGroup>
    </div>
);

/**
 * Settings landing screen of the multichain shell. Rows are gated by the
 * same capabilities the legacy settings used (sdk services, config urls,
 * battery eligibility), so nothing appears that the platform can't do.
 */
export const MultichainSettingsPage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t, i18n } = useTranslation();
    const sdk = useAppSdk();
    const navigate = useNavigate();
    const account = useActiveAccount();
    const accounts = useAccountsState();
    const config = useActiveConfig();
    const { fiat } = useAppContext();
    const canSeeBattery = useCanSeeBattery();
    const isOnIosReview = useIsOnIosReview();
    const { interceptTonLinks } = useGlobalPreferences();

    const hasMigrationSources = useHasMigrationSourceWallets();
    const { data: migrationOpened } = useIsMigrationOpened();
    const { mutate: markMigrationOpened } = useMarkMigrationOpened();

    // A seed's other TON version lives in a sibling account (as on iOS);
    // the row is offered until some account of the seed holds it.
    const addableTonVersion =
        account.type === 'multichain' ? addableMultichainTonVersion(accounts, account) : undefined;
    const { mutateAsync: addTonVersion, isLoading: isAddingTonVersion } =
        useAddMultichainTonVersion();
    const toastMutationError = useToastMutationError();
    const onAddTonVersion = async () => {
        if (
            account.type !== 'multichain' ||
            addableTonVersion === undefined ||
            isAddingTonVersion
        ) {
            return;
        }
        try {
            await addTonVersion({ account, version: addableTonVersion });
            navigate(MultichainRoute.home);
        } catch (e) {
            toastMutationError(e);
        }
    };

    const [supportOpen, setSupportOpen] = useState(false);
    const [signOutOpen, setSignOutOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const fiatDisplay = fiat === FiatCurrencies.GRAM ? BRAND_CONFIG.coinSymbol : fiat;
    const toSettings = (route: MultichainSettingsRoute) =>
        navigate(MultichainRoute.settings + route);

    return (
        <SettingsPageLayout
            compact={compact}
            header={!compact}
            title={t('settings_title')}
            onBack={() => navigate(MultichainRoute.home)}
        >
            <div>
                <Group>
                    <SettingsListCell
                        title={account.name}
                        subtitle={t('customize')}
                        leftImage={
                            // Steps up with the row, which hovers to the tint
                            // this circle is filled with.
                            <div className="flex size-11 items-center justify-center rounded-full bg-backgroundContentTint transition-colors duration-100 group-hover:bg-backgroundContentAttention">
                                <WalletEmoji
                                    emoji={account.emoji}
                                    emojiSize="24px"
                                    containerSize="24px"
                                />
                            </div>
                        }
                        chevron
                        onClick={() => toSettings(MultichainSettingsRoute.customize)}
                    />
                </Group>

                {hasMigrationSources && (
                    <Group>
                        <SettingsListCell
                            title={t('migration')}
                            subtitle={t('migration_subtitle')}
                            dot={migrationOpened === false ? 'accent' : undefined}
                            rightIcon={<IcTrayArrowDown28 />}
                            onClick={() => {
                                markMigrationOpened();
                                toSettings(MultichainSettingsRoute.migration);
                            }}
                        />
                    </Group>
                )}

                <Group>
                    <SettingsListCell
                        title={t('settings_backup_seed')}
                        rightIcon={<IcKey28 />}
                        onClick={() => toSettings(MultichainSettingsRoute.backup)}
                    />
                    {addableTonVersion !== undefined && (
                        <SettingsListCell
                            title={t(
                                addableTonVersion === WalletVersion.V5R1
                                    ? 'settings_wallet_w5'
                                    : 'settings_wallet_v4r2'
                            )}
                            rightIcon={<IcWallet28 />}
                            onClick={onAddTonVersion}
                        />
                    )}
                    {!!sdk.notifications && (
                        <SettingsListCell
                            title={t('settings_notifications')}
                            rightIcon={<IcBell28 />}
                            onClick={() => toSettings(MultichainSettingsRoute.notifications)}
                        />
                    )}
                    <SettingsListCell
                        title={t('settings_primary_currency')}
                        rightText={fiatDisplay}
                        onClick={() => toSettings(MultichainSettingsRoute.currency)}
                    />
                    {!!sdk.linksInterceptorAvailable && (
                        <SettingsListCell
                            title={t('settings_intercept_links')}
                            rightText={t(INTERCEPT_LINKS_OPTION_TITLES[interceptTonLinks])}
                            onClick={() => toSettings(MultichainSettingsRoute.interceptLinks)}
                        />
                    )}
                    {canSeeBattery && !isOnIosReview && (
                        <SettingsListCell
                            title={t('settings_battery')}
                            rightIcon={<IcBattery28 />}
                            onClick={() => toSettings(MultichainSettingsRoute.battery)}
                        />
                    )}
                    <SettingsListCell
                        title={t('settings_connected_apps')}
                        rightIcon={<IcApps28 />}
                        onClick={() => toSettings(MultichainSettingsRoute.connectedApps)}
                    />
                </Group>

                <Group>
                    <SettingsListCell
                        title={t('settings_security')}
                        rightIcon={<IcLock28 />}
                        onClick={() => toSettings(MultichainSettingsRoute.security)}
                    />
                    {i18n.enable && (
                        <SettingsListCell
                            title={t('settings_language')}
                            rightText={getLanguageName(i18n.language, i18n.language)}
                            onClick={() => toSettings(MultichainSettingsRoute.language)}
                        />
                    )}
                </Group>

                <Group>
                    {!!config.faq_url && (
                        <SettingsListCell
                            title={t('settings_faq')}
                            rightIcon={<IcQuestion28 />}
                            onClick={() => sdk.openPage(config.faq_url!)}
                        />
                    )}
                    <SettingsListCell
                        title={t('settings_support')}
                        rightIcon={<IcMessageBubble28 />}
                        onClick={() => setSupportOpen(true)}
                    />
                    {!!config.tonkeeperNewsUrl && (
                        <SettingsListCell
                            title={t('settings_news')}
                            rightIcon={<IcTelegram28 />}
                            rightIconTint="secondary"
                            onClick={() => sdk.openPage(config.tonkeeperNewsUrl!)}
                        />
                    )}
                    {!!sdk.storeUrl && (
                        <SettingsListCell
                            title={t('settings_rate')}
                            rightIcon={<IcStar28 />}
                            rightIconTint="secondary"
                            onClick={() => sdk.openPage(sdk.storeUrl!)}
                        />
                    )}
                    <SettingsListCell
                        title={t(
                            accounts.length > 1
                                ? 'Delete_all_accounts_and_logout'
                                : 'settings_delete_account'
                        )}
                        rightIcon={<IcTrashBin28 />}
                        rightIconTint="secondary"
                        onClick={() => setDeleteOpen(true)}
                    />
                    <SettingsListCell
                        title={t('settings_legal_documents')}
                        rightIcon={<IcDoc28 />}
                        rightIconTint="secondary"
                        onClick={() => toSettings(MultichainSettingsRoute.legal)}
                    />
                </Group>

                <Group>
                    <SettingsListCell
                        title={
                            <>
                                {t('settings_reset')}
                                <span className="ml-2 inline-flex items-center gap-1 align-bottom text-textSecondary">
                                    <WalletEmoji
                                        emoji={account.emoji}
                                        emojiSize="16px"
                                        containerSize="16px"
                                    />
                                    {account.name}
                                </span>
                            </>
                        }
                        rightIcon={<IcDoor28 />}
                        onClick={() => setSignOutOpen(true)}
                    />
                </Group>

                <SettingsVersionFooter />
            </div>

            <SupportSheet isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
            <SignOutSheet isOpen={signOutOpen} onClose={() => setSignOutOpen(false)} />
            <DeleteAccountSheet isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} />
        </SettingsPageLayout>
    );
};
