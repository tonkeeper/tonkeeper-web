import { FC } from 'react';

import { TradingMarketAsset } from '@tonkeeper/core/dist/service/tradingService';

import { ChainChip } from '../../../../primitives';
import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { AssetViewSource } from '../../../../hooks/analytics/asset-view';
import { useOpenAssetPage } from '../asset/useOpenAssetPage';
import {
    diffColorClass,
    formatPercentChange,
    isNativeRow,
    networkLabel,
    parseAssetIdHead
} from '../multichain-utils';
import {
    TokenCell,
    TokenCellIcon,
    TokenTrustedBadge,
    TokenVerificationWarning
} from '../TokenCell';

function parsePriceNumber(price: string | undefined): number | undefined {
    if (price === undefined || price === null) return undefined;
    const parsed = Number(price);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export const CryptoCatalogRow: FC<{
    asset: TradingMarketAsset;
    onSelect?: () => void;
    /** The catalog body is hosted both on the wallet screen and in the Trade tab. */
    assetViewSource?: AssetViewSource;
}> = ({ asset, onSelect, assetViewSource = 'wallet_screen' }) => {
    const { fiat } = useAppContext();
    const openAsset = useOpenAssetPage();
    const { network } = parseAssetIdHead(asset.assetId);
    const native = isNativeRow(asset.assetId);

    const handleClick = () => {
        if (onSelect) onSelect();
        openAsset(asset.assetId, assetViewSource);
    };

    const priceNum = parsePriceNumber(asset.price);
    const diff = formatPercentChange(asset.change24hPercent);

    return (
        <TokenCell
            onClick={handleClick}
            icon={<TokenCellIcon assetId={asset.assetId} image={asset.image} />}
            title={asset.symbol}
            titleExtras={
                <>
                    <TokenTrustedBadge verification={asset.verification} />
                    {!native && <ChainChip label={networkLabel(network)} />}
                </>
            }
            subtitle={asset.name}
            rightPrimary={priceNum !== undefined ? formatFiatCurrency(fiat, priceNum) : undefined}
            rightSecondary={
                asset.verification === 'none' || asset.verification === 'blacklist' ? (
                    <TokenVerificationWarning verification={asset.verification} />
                ) : (
                    diff && <span className={diffColorClass(asset.change24hPercent)}>{diff}</span>
                )
            }
        />
    );
};
