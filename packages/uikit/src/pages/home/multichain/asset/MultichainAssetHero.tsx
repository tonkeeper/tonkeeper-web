import { FC } from 'react';
import { useTranslation } from '../../../../hooks/translation';

import { intlDateLocale } from '@tonkeeper/core/dist/entries/language';
import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { ChartPriceChange } from '@tonkeeper/core/dist/service/tradingService';

import { ChainBadgeOverlay, useIsSkeleton, useSkeletonMask } from '../../../../primitives';
import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency } from '../../../../hooks/balance';
import {
    ChartPeriod,
    ChartPeriodChange,
    ChartScrubPoint
} from '../../../../state/trading/useAssetCharts';
import {
    diffColorClass,
    formatPercentChange,
    isNativeRow,
    networkIcon,
    parseAssetIdHead
} from '../multichain-utils';
import { TokenImage } from '../TokenImage';

const PERIOD_LABEL_KEY: Record<ChartPeriod, string> = {
    H: 'wallet_asset_chart_last_hour',
    D: 'wallet_asset_chart_last_day',
    W: 'wallet_asset_chart_last_week',
    M: 'wallet_asset_chart_last_month',
    '6M': 'wallet_asset_chart_last_half_year',
    Y: 'wallet_asset_chart_last_year'
};

function formatScrubDate(timestampSec: number, language: string): string {
    const date = new Date(timestampSec * 1000);
    const locale = intlDateLocale(language);
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
    const dayMonth = new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short'
    }).format(date);
    const time = new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(date);
    return `${weekday}, ${dayMonth} ${time}`;
}

const PriceChangeValues: FC<{ change: ChartPriceChange }> = ({ change }) => {
    const { fiat } = useAppContext();
    const colorClass = diffColorClass(change.diffPercent);
    return (
        <>
            <span className={colorClass}>{formatPercentChange(change.diffPercent)}</span>
            <span className={colorClass}>
                {formatFiatCurrency(fiat, Math.abs(change.diffFiat))}
            </span>
        </>
    );
};

export const MultichainAssetHero: FC<{
    asset: MultichainWalletAsset;
    /** Chart point under the cursor — swaps the readout to that moment. */
    scrub?: ChartScrubPoint | null;
    /** Move over the selected chart period; without it the readout shows the 24h change. */
    periodChange?: ChartPeriodChange;
    /** The first chart window is still loading — its readout line is a bar until it lands. */
    periodChangeLoading?: boolean;
}> = ({ asset, scrub, periodChange, periodChangeLoading = false }) => {
    const {
        t,
        i18n: { language }
    } = useTranslation();
    const { fiat } = useAppContext();
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();
    const changeMask = useSkeletonMask(isSkeleton || periodChangeLoading);
    const { network } = parseAssetIdHead(asset.assetId);
    const native = isNativeRow(asset.assetId);

    const tokenIcon = (
        <TokenImage
            src={asset.image}
            fallback={networkIcon(network)}
            className="h-14 w-14 bg-backgroundContent"
        />
    );

    return (
        <section className="flex flex-col gap-3 px-6 pb-1 pt-2">
            <ChainBadgeOverlay
                className="self-start"
                icon={native || isSkeleton ? undefined : networkIcon(network)}
            >
                {tokenIcon}
            </ChainBadgeOverlay>
            <div className="flex flex-col gap-1">
                <div {...mask({ w: 97, h: 32, r: 100 })} className="text-h2 text-textPrimary">
                    {scrub
                        ? formatFiatCurrency(fiat, scrub.price)
                        : periodChange
                        ? formatFiatCurrency(fiat, periodChange.price)
                        : asset.price
                        ? formatFiatCurrency(fiat, asset.price)
                        : '—'}
                </div>
                {scrub ? (
                    <div className="flex items-center gap-2 text-body2 text-textSecondary">
                        <PriceChangeValues change={scrub} />
                        <span>{formatScrubDate(scrub.timestamp, language)}</span>
                    </div>
                ) : periodChange || periodChangeLoading ? (
                    <div
                        {...changeMask({ w: 221, h: 16, r: 12 })}
                        className="flex items-center gap-2 text-body2 text-textSecondary"
                    >
                        {periodChange && (
                            <>
                                <PriceChangeValues change={periodChange} />
                                <span>{t(PERIOD_LABEL_KEY[periodChange.period])}</span>
                            </>
                        )}
                    </div>
                ) : (
                    <div
                        {...mask({ w: 221, h: 16, r: 12 })}
                        className="flex items-center gap-2 text-body2 text-textSecondary"
                    >
                        {asset.diff24h && (
                            <span className={diffColorClass(asset.diff24h)}>
                                {formatPercentChange(asset.diff24h)}
                            </span>
                        )}
                        <span>{t('wallet_asset_24h')}</span>
                    </div>
                )}
            </div>
        </section>
    );
};
