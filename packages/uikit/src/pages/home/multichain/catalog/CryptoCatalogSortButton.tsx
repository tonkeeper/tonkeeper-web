import { FC } from 'react';

import { TradingCatalogSorting } from '@tonkeeper/core/dist/service/tradingService';

import { useTranslation } from '../../../../hooks/translation';
import { SelectPill } from '../SelectPill';

const OPTIONS: { value: TradingCatalogSorting; labelKey: string }[] = [
    { value: 'market_cap', labelKey: 'wallet_asset_market_cap' },
    { value: 'volume', labelKey: 'wallet_asset_volume' },
    { value: 'top_gainers', labelKey: 'crypto_catalog_sort_top_gainers' },
    { value: 'top_losers', labelKey: 'crypto_catalog_sort_top_losers' }
];

/**
 * Catalog sort control: the shared {@link SelectPill} pinned over the bottom of
 * the asset list, so its menu opens upwards.
 */
export const CryptoCatalogSortButton: FC<{
    value: TradingCatalogSorting;
    onChange: (sorting: TradingCatalogSorting) => void;
}> = ({ value, onChange }) => {
    const { t } = useTranslation();

    return (
        <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
            <SelectPill
                value={value}
                options={OPTIONS.map(option => ({
                    value: option.value,
                    label: t(option.labelKey)
                }))}
                onChange={onChange}
                variant="tertiary"
                menuPosition="above-center"
                menuWidth={180}
                className="shadow-lg"
            />
        </div>
    );
};
