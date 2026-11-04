import { FC } from 'react';
import { useTranslation } from '../../../../hooks/translation';

import { AssetDetailsOverview } from '@tonkeeper/core/dist/service/tradingService';

import { useAppContext } from '../../../../hooks/appContext';
import { formatCompact } from '@tonkeeper/core/dist/utils/numberFormat';
import { ListTitle } from '../ListTitle';
import { MultichainHint } from '../MultichainHint';

interface RowProps {
    label: string;
    hint: string;
    value?: string;
    isFirst?: boolean;
}

const Row: FC<RowProps> = ({ label, hint, value, isFirst }) => {
    if (!value) return null;
    return (
        <div
            className={
                'flex items-center justify-between p-4 ' +
                (!isFirst ? 'border-t border-separatorCommon' : '')
            }
        >
            <div className="flex items-center gap-1 text-body1 text-textSecondary">
                <span>{label}</span>
                <MultichainHint label={label} text={hint} />
            </div>
            <div className="text-label1 text-textPrimary">{value}</div>
        </div>
    );
};

export const MultichainAssetOverview: FC<{ overview: AssetDetailsOverview }> = ({ overview }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    if (!overview.enabled) return null;
    if (!overview.marketCap && !overview.totalSupply && !overview.circulatingSupply) return null;

    return (
        <section className="flex flex-col px-4 pb-4">
            <ListTitle title={t('wallet_asset_overview')} />
            {/* No overflow-hidden: the hint bubbles extend above the card. */}
            <div className="rounded-medium bg-backgroundContent">
                <Row
                    label={t('wallet_asset_market_cap')}
                    hint={t('wallet_asset_market_cap_hint')}
                    value={
                        overview.marketCap && formatCompact(overview.marketCap, { currency: fiat })
                    }
                    isFirst
                />
                <Row
                    label={t('wallet_asset_total_supply')}
                    hint={t('wallet_asset_total_supply_hint')}
                    value={overview.totalSupply && formatCompact(overview.totalSupply)}
                />
                <Row
                    label={t('wallet_asset_circulating_supply')}
                    hint={t('wallet_asset_circulating_supply_hint')}
                    value={overview.circulatingSupply && formatCompact(overview.circulatingSupply)}
                />
            </div>
        </section>
    );
};
