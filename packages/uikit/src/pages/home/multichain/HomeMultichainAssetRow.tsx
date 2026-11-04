import { FC, useMemo } from 'react';
import BigNumber from 'bignumber.js';

import {
    MultichainWalletAsset,
    isVerifiedMultichainAsset
} from '@tonkeeper/core/dist/service/multichainWalletService';

import { formatAmount } from '@tonkeeper/core/dist/utils/numberFormat';
import { ChainChip } from '../../../primitives';
import { useAppContext } from '../../../hooks/appContext';
import { formatFiatCurrency } from '../../../hooks/balance';
import { cn } from '../../../libs/css';
import { useOpenAssetPage } from './asset/useOpenAssetPage';
import {
    diffColorClass,
    formatPercentChange,
    isNativeRow,
    networkLabel,
    parseAssetIdHead
} from './multichain-utils';
import { TokenCell, TokenCellIcon, TokenTrustedBadge, TokenVerificationWarning } from './TokenCell';

export const HomeMultichainAssetRow: FC<{ asset: MultichainWalletAsset }> = ({ asset }) => {
    const { fiat } = useAppContext();
    const openAsset = useOpenAssetPage();
    const native = isNativeRow(asset.assetId);
    const { network } = parseAssetIdHead(asset.assetId);

    const human = useMemo(
        () => new BigNumber(asset.balance).shiftedBy(-asset.decimals),
        [asset.balance, asset.decimals]
    );
    const fiatBalance = useMemo(
        () => (asset.price ? human.multipliedBy(asset.price) : undefined),
        [human, asset.price]
    );

    return (
        <TokenCell
            onClick={() => openAsset(asset.assetId)}
            icon={<TokenCellIcon assetId={asset.assetId} image={asset.image} />}
            title={asset.symbol}
            titleExtras={
                <>
                    <TokenTrustedBadge verification={asset.verification} />
                    {!native && <ChainChip label={networkLabel(network)} />}
                </>
            }
            subtitle={
                isVerifiedMultichainAsset(asset.verification) ? (
                    <>
                        {asset.price !== undefined && (
                            <span>{formatFiatCurrency(fiat, asset.price)}</span>
                        )}
                        {asset.diff24h && (
                            <span
                                className={cn(
                                    asset.price !== undefined && 'ml-1.5',
                                    diffColorClass(asset.diff24h)
                                )}
                            >
                                {formatPercentChange(asset.diff24h)}
                            </span>
                        )}
                    </>
                ) : (
                    <TokenVerificationWarning verification={asset.verification} />
                )
            }
            rightPrimary={formatAmount(human)}
            rightSecondary={fiatBalance && formatFiatCurrency(fiat, fiatBalance)}
        />
    );
};
