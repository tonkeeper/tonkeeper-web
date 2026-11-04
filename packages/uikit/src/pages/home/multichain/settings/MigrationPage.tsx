import { FC, useEffect, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import { walletVersionText } from '@tonkeeper/core/dist/entries/wallet';
import { MigrationSourceSchema } from '@tonkeeper/core/dist/analytics/generated/models/MigrationSourceSchema';

import { useAppContext } from '../../../../hooks/appContext';
import { useAnalyticsTrack } from '../../../../hooks/analytics';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useSearchParams } from '../../../../hooks/router/useSearchParams';
import { useTranslation } from '../../../../hooks/translation';
import { cn } from '../../../../libs/css';
import { MultichainRoute, MultichainSettingsRoute } from '../../../../libs/routes';
import { Button, Radio } from '../../../../primitives';
import { SkeletonScope, useIsSkeleton, useSkeletonMask } from '../../../../primitives/Skeleton';
import { useAddWalletFlow } from '../../../../components/modals/AddWalletFlow';
import {
    MigrationPickerWallet,
    useMigratableWallets
} from '../../../../state/multichain/useMigration';
import IcInformationCircle16 from '../../../../icons/components/IcInformationCircle16';
import IcTrayArrowDown28 from '../../../../icons/components/IcTrayArrowDown28';
import { WalletAvatar } from '../wallets/WalletAvatar';
import { MigrationHowItWorksSheet } from './MigrationHowItWorksSheet';
import { SettingsPageLayout } from './SettingsPageLayout';

export interface MigrationWalletRowData {
    walletId: string;
    accountId: string;
    name: string;
    emoji: string;
    versionLabel: string;
    subtitle: string;
}

export const MigrationWalletRow: FC<{
    wallet: MigrationWalletRowData;
    selected: boolean;
    divider: boolean;
    onSelect: () => void;
}> = ({ wallet, selected, divider, onSelect }) => {
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();

    return (
        <div>
            {divider && <div className="ml-4 h-[0.5px] bg-separatorCommon" />}
            <button
                type="button"
                onClick={onSelect}
                // Placeholder rows must not fire selection — nothing real to pick.
                disabled={isSkeleton}
                className={cn(
                    'flex w-full items-center text-left',
                    !isSkeleton &&
                        'cursor-pointer transition-colors duration-100 hover:bg-backgroundContentTint'
                )}
            >
                <div className="shrink-0 py-4 pl-4">
                    <div {...mask({ w: 44, h: 44, r: 22 })}>
                        <WalletAvatar accountId={wallet.accountId} emoji={wallet.emoji} />
                    </div>
                </div>
                <div className="min-w-0 flex-1 p-4">
                    <div className="flex items-center gap-1.5">
                        <span
                            className="truncate text-label1 text-textPrimary"
                            {...mask({ w: 65 })}
                        >
                            {wallet.name}
                        </span>
                        {!isSkeleton && !!wallet.versionLabel && (
                            <span className="shrink-0 rounded-md bg-backgroundContentTint px-1.5 py-0.5 text-body4Caps uppercase text-textSecondary">
                                {wallet.versionLabel}
                            </span>
                        )}
                    </div>
                    <div className="truncate text-body2 text-textSecondary" {...mask({ w: 170 })}>
                        {wallet.subtitle}
                    </div>
                </div>
                <div className="shrink-0 py-4 pr-4">
                    {isSkeleton ? (
                        <div className="size-6" {...mask({ w: 24, h: 24, r: 12 })} />
                    ) : (
                        <Radio variant="dot" checked={selected} onChange={onSelect} />
                    )}
                </div>
            </button>
        </div>
    );
};

const SKELETON_ROWS: MigrationWalletRowData[] = Array.from({ length: 5 }, (_, i) => ({
    walletId: `skeleton-${i}`,
    accountId: `skeleton-${i}`,
    name: 'Wallet',
    emoji: '',
    versionLabel: '',
    subtitle: '0'
}));

const MigrationEmptyView: FC = () => {
    const { t } = useTranslation();
    const { onOpen: openAddWallet } = useAddWalletFlow();

    return (
        <div className="flex flex-1 flex-col items-center justify-center px-8 pb-16 text-center">
            <IcTrayArrowDown28 className="mb-4 size-[56px] text-iconSecondary" />
            <h2 className="text-h2 text-textPrimary">{t('migration_empty_title')}</h2>
            <div className="mt-1 text-body1 text-textSecondary [text-wrap:balance]">
                {t('migration_empty_description')}
            </div>
            <Button
                variant="secondary"
                size="medium"
                className="mt-6"
                onClick={() => openAddWallet()}
            >
                {t('migration_add_ton_wallet')}
            </Button>
        </div>
    );
};

const MigrationErrorView: FC<{ onRetry: () => void }> = ({ onRetry }) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-1 flex-col items-center justify-center px-8 pb-16 text-center">
            <h2 className="text-h2 text-textPrimary">{t('error_occurred')}</h2>
            <Button variant="secondary" size="medium" className="mt-6" onClick={onRetry}>
                {t('try_again')}
            </Button>
        </div>
    );
};

/**
 * Migration wallet picker: choose the legacy TON wallet whose assets the
 * backend will move into this multichain wallet. Unlike the native apps
 * there is no backup detour before the confirmation step — a multichain
 * account can only exist here by passing the create flow's mandatory
 * recovery-phrase check or by the user typing the phrase at import, so
 * the "seed not backed up" state the natives gate on cannot occur.
 */
/** Query param naming where the flow was opened from, for `migration_start`. */
export const MIGRATION_FROM_PARAM = 'from';

const MIGRATION_SOURCES: MigrationSourceSchema[] = [
    'settings',
    'onboarding',
    'setup',
    'story',
    'banner',
    'raffle',
    'deeplink'
];

export const MigrationPage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { fiat } = useAppContext();
    const track = useAnalyticsTrack();
    const [searchParams] = useSearchParams();
    const { data: wallets, isLoading, isError, refetch } = useMigratableWallets();

    const [selectedId, setSelectedId] = useState<string>();
    const [howItWorksOpen, setHowItWorksOpen] = useState(false);

    const startTracked = useRef(false);
    useEffect(() => {
        if (startTracked.current) return;
        startTracked.current = true;
        const fromParam = searchParams.get(MIGRATION_FROM_PARAM);
        const from = MIGRATION_SOURCES.find(s => s === fromParam) ?? 'settings';
        track({ eventName: 'migration_start', from });
    }, [track, searchParams]);

    // Only when the list actually renders with content, once per mount —
    // returning from the confirmation screen is a remount and re-emits,
    // matching the natives' per-view-model semantics.
    const selectionViewTracked = useRef(false);
    useEffect(() => {
        if (!selectionViewTracked.current && wallets && wallets.length > 0) {
            selectionViewTracked.current = true;
            track({ eventName: 'migrate_wallet_selection_view' });
        }
    }, [wallets, track]);

    const effectiveSelectedId = selectedId ?? wallets?.[0]?.walletId;

    const toRowData = (wallet: MigrationPickerWallet): MigrationWalletRowData => {
        const fiatLabel = wallet.fiatTotal
            ? formatFiatCurrency(fiat, wallet.fiatTotal)
            : formatFiatCurrency(fiat, new BigNumber(0));
        const subtitle =
            wallet.value.nftCount > 0
                ? `${fiatLabel} · ${t('migration_nft_count', {
                      count: String(wallet.value.nftCount)
                  })}`
                : fiatLabel;
        return {
            walletId: wallet.walletId,
            accountId: wallet.accountId,
            name: wallet.name,
            emoji: wallet.emoji,
            versionLabel: walletVersionText(wallet.version),
            subtitle
        };
    };

    const isEmpty = !isLoading && !isError && (wallets?.length ?? 0) === 0;
    const rows = isLoading ? SKELETON_ROWS : (wallets ?? []).map(toRowData);

    return (
        <SettingsPageLayout
            compact={compact}
            onBack={() => navigate(MultichainRoute.settings)}
            title={t('migration')}
        >
            <div
                className={cn(
                    'mx-auto flex w-full max-w-[560px] flex-1 flex-col px-4 pb-4',
                    (isEmpty || isError) && 'justify-center'
                )}
            >
                {isError ? (
                    <MigrationErrorView onRetry={() => refetch()} />
                ) : isEmpty ? (
                    <MigrationEmptyView />
                ) : (
                    <>
                        <div className="flex flex-col gap-1 px-6 pb-1 text-center">
                            <h2 className="text-h2 text-textPrimary">
                                {t('migration_prepare_title')}
                            </h2>
                            <div className="text-body2 text-textSecondary [text-wrap:balance]">
                                {t('migration_prepare_description')}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setHowItWorksOpen(true)}
                            className="mx-auto mb-4 flex items-center gap-1 py-1 text-body2 text-textAccent"
                        >
                            <IcInformationCircle16 className="size-4" />
                            {t('migration_how_it_works')}
                        </button>

                        <SkeletonScope loading={isLoading}>
                            <div className="overflow-hidden rounded-medium bg-backgroundContent [--tk-skeleton-fill:var(--tk-background-content-tint)]">
                                {rows.map((row, index) => (
                                    <MigrationWalletRow
                                        key={row.walletId}
                                        wallet={row}
                                        divider={index > 0}
                                        selected={
                                            !isLoading && row.walletId === effectiveSelectedId
                                        }
                                        onSelect={() => setSelectedId(row.walletId)}
                                    />
                                ))}
                            </div>
                        </SkeletonScope>

                        <div className="sticky bottom-0 mt-auto bg-backgroundPage pt-4">
                            <Button
                                variant="primaryBlue"
                                size="large"
                                fullWidth
                                disabled={isLoading || !effectiveSelectedId}
                                onClick={() => {
                                    track({ eventName: 'migrate_wallet_selection_click' });
                                    navigate(
                                        `${
                                            MultichainRoute.settings +
                                            MultichainSettingsRoute.migrationConfirm
                                        }?walletId=${effectiveSelectedId}`,
                                        { replace: true }
                                    );
                                }}
                            >
                                {t('continue')}
                            </Button>
                        </div>
                    </>
                )}
            </div>

            <MigrationHowItWorksSheet
                isOpen={howItWorksOpen}
                onClose={() => setHowItWorksOpen(false)}
            />
        </SettingsPageLayout>
    );
};
