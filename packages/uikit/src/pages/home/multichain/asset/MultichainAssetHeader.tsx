import { FC } from 'react';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { useSkeletonMask } from '../../../../primitives';
import { useNavigateBack } from '../../../../hooks/router/useNavigateBack';
import { useTranslation } from '../../../../hooks/translation';
import { MultichainRoute } from '../../../../libs/routes';
import IcVerification16 from '../../../../icons/components/IcVerification16';
import { BackButton } from '../../../../primitives/BackButton';
import { networkLabel, parseAssetIdHead } from '../multichain-utils';
import { MultichainAssetFavoriteButton } from './MultichainAssetFavoriteButton';
import { MultichainAssetMenu } from './MultichainAssetMenu';

export const MultichainAssetHeader: FC<{
    asset: MultichainWalletAsset;
    verified?: boolean;
    onVerifiedClick?: () => void;
    onVisibilityChange?: (hidden: boolean) => void;
}> = ({ asset, verified = false, onVerifiedClick, onVisibilityChange }) => {
    const { t } = useTranslation();
    const navigateBack = useNavigateBack(MultichainRoute.home);
    const mask = useSkeletonMask();
    const { network } = parseAssetIdHead(asset.assetId);

    return (
        <header className="relative flex h-[64px] shrink-0 items-center justify-center px-16">
            <BackButton
                onClick={navigateBack}
                className="absolute left-2 top-1/2 -translate-y-1/2"
            />
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                    <span {...mask({ w: 97, h: 20 })} className="text-h3 text-textPrimary">
                        {asset.name}
                    </span>
                    {verified && (
                        <button
                            type="button"
                            aria-label={t('wallet_asset_verified_token')}
                            onClick={onVerifiedClick}
                            className="cursor-pointer text-textAccent transition-opacity duration-100 hover:opacity-80"
                        >
                            <IcVerification16 className="size-4" />
                        </button>
                    )}
                </div>
                <div {...mask({ w: 55 })} className="text-body2 text-textSecondary">
                    {networkLabel(network)}
                </div>
            </div>
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <MultichainAssetMenu
                    assetId={asset.assetId}
                    isHidden={asset.isHidden}
                    onVisibilityChange={onVisibilityChange}
                />
                <MultichainAssetFavoriteButton
                    stub={{
                        assetId: asset.assetId,
                        symbol: asset.symbol,
                        name: asset.name,
                        imageUrl: asset.image
                    }}
                />
            </div>
        </header>
    );
};
