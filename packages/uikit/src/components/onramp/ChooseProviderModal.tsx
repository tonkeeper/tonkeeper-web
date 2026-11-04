import { FC } from 'react';
import type { ExchangeMerchantSlug, RampQuote } from '@tonkeeper/core/dist/onrampApi';
import { Modal } from '../../primitives/Modal';
import IcDonemarkOutline28 from '../../icons/components/IcDonemarkOutline28';
import { useTranslation } from '../../hooks/translation';
import { cn } from '../../libs/css';
import { BestBadge } from './BestBadge';
import { formatAmount } from '@tonkeeper/core/dist/utils/numberFormat';
import { formatRampRate, RampDirection } from './ProviderCard';

export interface ChooseProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Top-left back arrow — returns to the amount step. */
    onBack?: () => void;
    /** Quotes valid at the current amount. */
    items: RampQuote[];
    /** Quotes whose merchant requires a different amount (carries min/max). */
    suggested: RampQuote[];
    /** Currently selected merchant; checkmark is drawn on its row. */
    selectedMerchant?: ExchangeMerchantSlug;
    /** Merchant carrying the BEST badge — usually `items[0]?.merchant`. */
    bestMerchant?: ExchangeMerchantSlug;
    fiat: string;
    symbol: string;
    /** See `ProviderCard`: flips the rate line and the unit of the limits. */
    direction?: RampDirection;
    /** `merchantSlug → image URL`, sourced from `useExchangeMerchants()`. */
    merchantImageBySlug?: ReadonlyMap<string, string> | Readonly<Record<string, string>>;
    onSelect: (quote: RampQuote) => void;
}

export type ChooseProviderContentProps = Omit<
    ChooseProviderModalProps,
    'isOpen' | 'onClose' | 'onBack'
>;

interface Row {
    quote: RampQuote;
    showMin: boolean;
}

const buildRows = (items: RampQuote[], suggested: RampQuote[]): Row[] => {
    const itemMerchants = new Set(items.map(i => i.merchant));
    const rows: Row[] = items.map(quote => ({ quote, showMin: false }));
    for (const quote of suggested) {
        if (itemMerchants.has(quote.merchant)) continue;
        rows.push({ quote, showMin: !!quote.minAmount });
    }
    return rows;
};

const getMerchantImage = (
    merchantImageBySlug: ChooseProviderModalProps['merchantImageBySlug'],
    merchant: string
) => {
    if (!merchantImageBySlug) return undefined;

    if (typeof (merchantImageBySlug as ReadonlyMap<string, string>).get === 'function') {
        return (merchantImageBySlug as ReadonlyMap<string, string>).get(merchant);
    }

    return (merchantImageBySlug as Readonly<Record<string, string>>)[merchant];
};

const MerchantImage: FC<{ src?: string }> = ({ src }) => (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-small bg-backgroundContentTint">
        {src && <img src={src} alt="" className="block h-full w-full object-cover" />}
    </div>
);

const ProviderRow: FC<{
    row: Row;
    isSelected: boolean;
    isBest: boolean;
    fiat: string;
    symbol: string;
    direction: RampDirection;
    image?: string;
    onClick: () => void;
}> = ({ row, isSelected, isBest, fiat, symbol, direction, image, onClick }) => {
    const { t } = useTranslation();
    const { quote } = row;
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 bg-backgroundContent px-4 py-3 text-left transition-colors hover:bg-backgroundContentTint focus:outline-none focus-visible:bg-backgroundContentTint"
        >
            <MerchantImage src={image} />
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                    <span className="truncate text-label1 text-textPrimary capitalize">
                        {quote.merchant}
                    </span>
                    {isBest && <BestBadge />}
                </div>
                <span className="truncate text-body2 text-textSecondary">
                    {formatRampRate(quote.rate, fiat, symbol, direction)}
                </span>
                {row.showMin && quote.minAmount && (
                    <span className="text-body2 text-accentOrange">
                        {t('choose_provider_min_amount', {
                            amount: formatAmount(quote.minAmount),
                            fiat: direction === 'sell' ? symbol : fiat
                        })}
                    </span>
                )}
            </div>
            {isSelected && <IcDonemarkOutline28 className="h-7 w-7 shrink-0 text-accentBlue" />}
        </button>
    );
};

export const ChooseProviderContent: FC<ChooseProviderContentProps> = ({
    items,
    suggested,
    selectedMerchant,
    bestMerchant,
    fiat,
    symbol,
    direction = 'buy',
    merchantImageBySlug,
    onSelect
}) => {
    const rows = buildRows(items, suggested);
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col overflow-hidden rounded-medium divide-y divide-separatorCommon">
                {rows.map(row => (
                    <ProviderRow
                        key={row.quote.merchant}
                        row={row}
                        isSelected={row.quote.merchant === selectedMerchant}
                        isBest={row.quote.merchant === bestMerchant}
                        fiat={fiat}
                        symbol={symbol}
                        direction={direction}
                        image={getMerchantImage(merchantImageBySlug, row.quote.merchant)}
                        onClick={() => onSelect(row.quote)}
                    />
                ))}
            </div>
            <p className={cn('text-body2 text-textSecondary')}>{t('choose_provider_footer')}</p>
        </div>
    );
};

export const ChooseProviderModal: FC<ChooseProviderModalProps> = ({
    isOpen,
    onClose,
    onBack,
    ...contentProps
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={onBack}
            variant="content"
            topBarTitle={t('choose_provider_title')}
        >
            <ChooseProviderContent {...contentProps} />
        </Modal>
    );
};
