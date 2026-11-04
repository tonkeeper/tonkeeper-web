import { FC, ReactNode, useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';

import { Toast } from '../../../../primitives';
import { useTrackAssetView } from '../../../../hooks/analytics/asset-view';
import { useNavigateBack } from '../../../../hooks/router/useNavigateBack';
import { useTranslation } from '../../../../hooks/translation';
import { cn } from '../../../../libs/css';
import { MultichainRoute } from '../../../../libs/routes';
import { SkeletonScope } from '../../../../primitives';
import { BackButton } from '../../../../primitives/BackButton';
import { ModalCenterError, ModalCenterState } from '../../../../components/shared/ModalCenterState';
import IcExclamationmarkCircle28 from '../../../../icons/components/IcExclamationmarkCircle28';
import { PLACEHOLDER_ASSET } from '../multichain-placeholders';
import { useMultichainWalletAsset } from '../../../../state/multichain/useMultichainWalletAsset';
import { useAssetDetails } from '../../../../state/trading/useAssetDetails';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../../../state/tonendpoint';
import {
    ChartPeriod,
    ChartScrubPoint,
    useAssetCharts
} from '../../../../state/trading/useAssetCharts';
import { MultichainAssetHeader } from './MultichainAssetHeader';
import { MultichainAssetNoticeBanner } from './MultichainAssetNoticeBanner';
import {
    InstrumentSheetVariant,
    MultichainAssetInstrumentSheet
} from './MultichainAssetInstrumentSheet';
import { MultichainAssetTransactionHistory } from './MultichainAssetTransactionHistory';
import {
    MultichainAssetVerificationSheet,
    VerificationSheetVariant
} from './MultichainAssetVerificationSheet';
import { MultichainAssetHero } from './MultichainAssetHero';
import { MultichainAssetChart } from './MultichainAssetChart';
import { MultichainAssetPeriodSelector } from './MultichainAssetPeriodSelector';
import { MultichainAssetBalanceCard } from './MultichainAssetBalanceCard';
import { MultichainAssetAbout } from './MultichainAssetAbout';
import { MultichainAssetOverview } from './MultichainAssetOverview';
import { MultichainAssetTradingActivity } from './MultichainAssetTradingActivity';
import { MultichainAssetLinks } from './MultichainAssetLinks';
import { MultichainAssetActionBar } from './MultichainAssetActionBar';
import { MultichainAssetActionRow } from './MultichainAssetActionRow';

export const MultichainAssetPage: FC<{ assetId: string; compact?: boolean }> = ({
    assetId,
    compact = false
}) => {
    const { t } = useTranslation();
    useTrackAssetView(assetId);
    const { asset, isFetching, isError, refetch } = useMultichainWalletAsset(assetId);
    const { data: details, isLoading: detailsLoading } = useAssetDetails(assetId);
    // Buy/Sell open the swap flow, so they follow the asset's `swap`
    // capability AND the global kill switch — capability alone kept the
    // buttons working on iOS while the main screen had swap disabled. An
    // asset the server lists without capabilities (tokenized stocks) or
    // outside the trading catalog has nothing to swap into, so it gets no
    // bar; only the first load assumes the capability, to avoid hiding the
    // bar on every page open.
    const swapsEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.SWAPS);
    const canSwap =
        swapsEnabled &&
        (detailsLoading || (details?.capabilities?.capabilities.includes('swap') ?? false));
    const canCashBuy = details?.capabilities?.capabilities.includes('onramp') ?? false;
    const canCashSell = details?.capabilities?.capabilities.includes('offramp') ?? false;
    const [period, setPeriod] = useState<ChartPeriod>('M');
    const [scrub, setScrub] = useState<ChartScrubPoint | null>(null);
    const chart = useAssetCharts(assetId, period);
    // A failed window falls back to the 24h readout, matching the chart's
    // own error state. During a period switch the previous window's change
    // stays up, labelled with its own period, until the new one lands.
    const periodChange = chart.isError ? undefined : chart.data?.periodChange;
    const periodChangeLoading = chart.isFetching && (!chart.data || chart.isError);
    const [visibilityToast, setVisibilityToast] = useState<'hidden' | 'shown' | undefined>();
    const [verificationSheet, setVerificationSheet] = useState<
        VerificationSheetVariant | undefined
    >();
    const [instrumentSheetOpen, setInstrumentSheetOpen] = useState(false);

    useEffect(() => {
        if (!visibilityToast) return;
        const timeout = setTimeout(() => setVisibilityToast(undefined), 2000);
        return () => clearTimeout(timeout);
    }, [visibilityToast]);

    // Compact (desktop): the page is a direct child of the 520px scroll
    // column, so it fills the column and the action bar sticks to the
    // column's bottom edge (sticky takes flow space — no extra padding).
    // Full (mobile): the page owns the viewport, so min-h-screen +
    // pb-[120px] keep content from sitting under the fixed action bar.
    const shellClass = compact
        ? 'flex min-h-full flex-col bg-backgroundPage'
        : 'flex min-h-screen flex-col bg-backgroundPage';
    const rootClass = cn(shellClass, !compact && canSwap && 'pb-[120px]');

    // Only a retryable failure gets a retry; a lookup the backend rejected
    // outright reads as "not found", since repeating it cannot succeed.
    if (!asset && !isFetching) {
        return (
            <AssetPageFallback className={shellClass}>
                {isError ? (
                    <ModalCenterError icon={<IcExclamationmarkCircle28 />} onRetry={refetch} />
                ) : (
                    <ModalCenterState
                        icon={<IcExclamationmarkCircle28 />}
                        title={t('not_found_title')}
                        subtitle={t('wallet_asset_not_found')}
                    />
                )}
            </AssetPageFallback>
        );
    }

    // Rendering only — everything that acts (menu, favorites, action bar,
    // dependent detail queries) keeps reading `asset`.
    const isLoading = !asset;
    const viewAsset = asset ?? PLACEHOLDER_ASSET;

    const human = new BigNumber(viewAsset.balance).shiftedBy(-viewAsset.decimals);
    const hasBalance = human.isGreaterThan(0);

    const instrument: InstrumentSheetVariant | undefined =
        details?.asset.assetType === 'stocks'
            ? 'stocks'
            : details?.asset.assetType === 'etfs'
            ? 'etfs'
            : undefined;
    // Trading details carry the fresher verification tier, but wallet-held
    // assets outside the trading catalog only have the wallet API's value.
    const verification = details?.asset.verification ?? asset?.verification;
    const unverified = verification === 'none' || verification === 'blacklist';

    return (
        <SkeletonScope loading={isLoading}>
            <div className={rootClass}>
                {visibilityToast && (
                    <div className="pointer-events-none fixed left-1/2 top-6 z-50 -translate-x-1/2">
                        <Toast
                            text={
                                visibilityToast === 'hidden'
                                    ? t('wallet_asset_hidden_toast')
                                    : t('wallet_asset_shown_toast')
                            }
                        />
                    </div>
                )}
                <MultichainAssetHeader
                    asset={viewAsset}
                    verified={verification === 'trusted'}
                    onVerifiedClick={() => setVerificationSheet('verified')}
                    onVisibilityChange={hidden => setVisibilityToast(hidden ? 'hidden' : 'shown')}
                />
                <MultichainAssetHero
                    asset={viewAsset}
                    scrub={scrub}
                    periodChange={periodChange}
                    periodChangeLoading={periodChangeLoading}
                />
                <MultichainAssetChart assetId={assetId} period={period} onScrub={setScrub} />
                <MultichainAssetPeriodSelector value={period} onChange={setPeriod} />
                {/* One strip under the chart, per the mockup annotation: the
                orange unverified warning wins over the blue tokenized-asset
                explainer when both apply. */}
                {unverified ? (
                    <MultichainAssetNoticeBanner
                        variant="warning"
                        text={t('wallet_asset_unverified_banner')}
                        onClick={() => setVerificationSheet('unverified')}
                        compact={compact}
                    />
                ) : (
                    instrument && (
                        <MultichainAssetNoticeBanner
                            variant="info"
                            text={
                                instrument === 'stocks'
                                    ? t('wallet_asset_tokenized_stock_banner')
                                    : t('wallet_asset_tokenized_etf_banner')
                            }
                            onClick={() => setInstrumentSheetOpen(true)}
                            compact={compact}
                        />
                    )
                )}
                {hasBalance && <MultichainAssetBalanceCard asset={viewAsset} human={human} />}
                {asset && (
                    <MultichainAssetActionRow
                        asset={asset}
                        hasBalance={hasBalance}
                        canCashBuy={canCashBuy}
                        canCashSell={canCashSell}
                        className={hasBalance ? 'pt-2' : 'pt-4'}
                    />
                )}
                {hasBalance && <MultichainAssetTransactionHistory asset={viewAsset} />}
                {details?.about && <MultichainAssetAbout about={details.about} />}
                {details?.overview && <MultichainAssetOverview overview={details.overview} />}
                {details?.tradingActivity && (
                    <MultichainAssetTradingActivity activity={details.tradingActivity} />
                )}
                {details?.links && <MultichainAssetLinks links={details.links} />}
                {asset && canSwap && (
                    <MultichainAssetActionBar
                        asset={asset}
                        hasBalance={hasBalance}
                        compact={compact}
                    />
                )}
                {verificationSheet && (
                    <MultichainAssetVerificationSheet
                        variant={verificationSheet}
                        isOpen
                        onClose={() => setVerificationSheet(undefined)}
                    />
                )}
                {instrument && instrumentSheetOpen && (
                    <MultichainAssetInstrumentSheet
                        variant={instrument}
                        isOpen
                        onClose={() => setInstrumentSheetOpen(false)}
                    />
                )}
            </div>
        </SkeletonScope>
    );
};

/**
 * Shell for the states that have no asset to render: the same header the
 * asset page uses, minus the asset-bound title and menu, so the way back to
 * the portfolio stays where the user expects it, over a centred placeholder.
 */
const AssetPageFallback: FC<{ className: string; children: ReactNode }> = ({
    className,
    children
}) => {
    const navigateBack = useNavigateBack(MultichainRoute.home);
    return (
        <div className={className}>
            <header className="relative flex h-[64px] shrink-0 items-center px-16">
                <BackButton
                    onClick={navigateBack}
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                />
            </header>
            <div className="flex flex-1 flex-col items-center justify-center">{children}</div>
        </div>
    );
};
