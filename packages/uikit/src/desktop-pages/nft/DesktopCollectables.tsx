import { useTranslation } from '../../hooks/translation';
import { useWalletFilteredNftList } from '../../state/nft';
import { FC, ReactNode, useMemo } from 'react';
import { KnownNFTDnsCollections } from '../../components/nft/NftView';
import { DesktopNFTS } from './DesktopNft';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../state/tonendpoint';
import { Navigate } from '../../components/shared/Navigate';
import { AppRoute } from '../../libs/routes';

export const DesktopCollectables: FC<{ collectiblesAccessory?: ReactNode }> = ({ collectiblesAccessory }) => {
    const { t } = useTranslation();
    const { data: nfts } = useWalletFilteredNftList();
    const filteredNft = useMemo(
        () =>
            nfts?.filter(
                nft =>
                    !nft.collection?.address ||
                    !KnownNFTDnsCollections.includes(nft.collection.address)
            ),
        [nfts]
    );

    const isEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.NFT);
    if (!isEnabled) {
        return <Navigate to={AppRoute.home} />;
    }

    return (
        <DesktopNFTS
            nfts={filteredNft}
            collectiblesAccessory={collectiblesAccessory}
            emptyPageTitle={t('collectibles_empty_header')}
            pageTitle={t('wallet_aside_collectibles')}
        />
    );
};
