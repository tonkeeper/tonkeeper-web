import { FC } from 'react';
import BigNumber from 'bignumber.js';
import type { RampQuote } from '@tonkeeper/core/dist/onrampApi';
import IcSwitch16 from '../../icons/components/IcSwitch16';
import { useTranslation } from '../../hooks/translation';
import { cn } from '../../libs/css';
import { formatAmount } from '@tonkeeper/core/dist/utils/numberFormat';
import { BestBadge } from './BestBadge';

export interface ProviderCardProps {
    /**
     * The merchant whose rate the card surfaces. When `belowMin` is true
     * this is the suggested fallback (since the typed amount can't produce
     * a valid `items` entry) and `quote.minAmount` carries the merchant's
     * minimum.
     */
    quote: RampQuote | undefined;
    fiat: string;
    symbol: string;
    /**
     * `buy` (on-ramp, default): the user types fiat, so the rate reads
     * `1 FIAT ≈ x SYMBOL` and limits are fiat. `sell` (off-ramp): the user
     * types crypto, so the rate is `1 SYMBOL ≈ x FIAT` and limits are crypto.
     */
    direction?: RampDirection;
    isLoading: boolean;
    image?: string;
    isBest: boolean;
    /** True when the typed amount sits below `quote.minAmount`. */
    belowMin: boolean;
    /** Show the vertical-switch chevron — only when >1 provider exists. */
    showSwitch: boolean;
    onClick?: () => void;
}

export type RampDirection = 'buy' | 'sell';

export const formatRampRate = (
    rate: string,
    fiat: string,
    symbol: string,
    direction: RampDirection
): string => {
    const r = new BigNumber(rate);
    if (!r.isFinite() || r.lte(0)) return '';
    return direction === 'sell'
        ? `1 ${symbol} ≈ ${formatAmount(r, { unit: fiat })}`
        : `1 ${fiat} ≈ ${formatAmount(r, { unit: symbol })}`;
};

/**
 * Provider snippet on the EnterAmountScreen — single row that shows the
 * picked merchant plus either the rate (`amount >= min`) or the merchant's
 * minimum in accentOrange (`amount < min`). The whole row is the affordance
 * for opening the provider picker.
 */
export const ProviderCard: FC<ProviderCardProps> = ({
    quote,
    fiat,
    symbol,
    direction = 'buy',
    isLoading,
    image,
    isBest,
    belowMin,
    showSwitch,
    onClick
}) => {
    const { t } = useTranslation();
    const interactive = !!onClick;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!interactive}
            className={cn(
                'flex min-h-[76px] w-full items-center gap-3 rounded-medium bg-backgroundContent px-4 py-4 text-left transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue',
                interactive ? 'cursor-pointer hover:bg-backgroundContentTint' : 'cursor-default'
            )}
        >
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-small bg-backgroundContentTint">
                {image && <img src={image} alt="" className="block h-full w-full object-cover" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
                {quote ? (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="truncate text-label1 text-textPrimary capitalize">
                                {quote.merchant}
                            </span>
                            {isBest && !belowMin && <BestBadge />}
                        </div>
                        {belowMin && quote.minAmount ? (
                            <span className="truncate text-body3 text-accentOrange">
                                {t('choose_provider_min_amount', {
                                    amount: formatAmount(quote.minAmount),
                                    fiat: direction === 'sell' ? symbol : fiat
                                })}
                            </span>
                        ) : (
                            <span className="truncate text-body3 text-textSecondary">
                                {formatRampRate(quote.rate, fiat, symbol, direction)}
                            </span>
                        )}
                    </>
                ) : (
                    <span className="text-body2 text-textSecondary">
                        {isLoading ? t('loading') : t('enter_amount_quote_hint')}
                    </span>
                )}
            </div>
            {showSwitch && <IcSwitch16 className="h-4 w-4 shrink-0 text-iconSecondary" />}
        </button>
    );
};
