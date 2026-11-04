import { FC } from 'react';
import { formatAmount } from '@tonkeeper/core/dist/utils/numberFormat';
import { useTranslation } from '../../../../hooks/translation';
import BigNumber from 'bignumber.js';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { ChainBadgeOverlay, useIsSkeleton, useSkeletonMask } from '../../../../primitives';
import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { isNativeRow, networkIcon, parseAssetIdHead } from '../multichain-utils';
import { TokenImage } from '../TokenImage';

export const MultichainAssetBalanceCard: FC<{
    asset: MultichainWalletAsset;
    human: BigNumber;
}> = ({ asset, human }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();
    const { network } = parseAssetIdHead(asset.assetId);
    const native = isNativeRow(asset.assetId);

    const fiatValue = asset.price ? human.multipliedBy(asset.price) : undefined;

    const tokenIcon = (
        <TokenImage
            src={asset.image}
            fallback={networkIcon(network)}
            className="h-11 w-11 bg-backgroundContentTint"
        />
    );

    return (
        <section className="flex flex-col px-4">
            <div className="py-3">
                <span {...mask({ w: 107, h: 24, r: 12 })} className="text-label1 text-textPrimary">
                    {t('wallet_asset_your_balance')}
                </span>
            </div>
            <div className="overflow-hidden rounded-medium bg-backgroundContent [--tk-skeleton-fill:var(--tk-background-content-tint)]">
                <div className="flex items-center gap-2 px-4 py-4">
                    <ChainBadgeOverlay
                        className="shrink-0"
                        icon={native || isSkeleton ? undefined : networkIcon(network)}
                    >
                        {tokenIcon}
                    </ChainBadgeOverlay>
                    <div className="flex flex-1 flex-col">
                        <div {...mask({ w: 65 })} className="text-label1 text-textPrimary">
                            {formatAmount(human)} {asset.symbol}
                        </div>
                        {isSkeleton ? (
                            <div {...mask({ w: 170 })} className="text-body2 text-textSecondary">
                                0
                            </div>
                        ) : fiatValue ? (
                            <div className="text-body2 text-textSecondary">
                                {formatFiatCurrency(fiat, fiatValue)}
                            </div>
                        ) : (
                            // Price unknown → the fiat line renders as a static
                            // bar (not the pulsing mask: nothing is loading).
                            <div className="flex h-5 items-center">
                                <div className="h-3 w-[170px] rounded-extraSmall bg-backgroundContentTint" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
