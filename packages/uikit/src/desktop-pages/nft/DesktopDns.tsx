import { useTranslation } from '../../hooks/translation';
import { useMemo } from 'react';
import { KnownNFTDnsCollections } from '../../components/nft/NftView';
import { useWalletFilteredNftList } from '../../state/nft';
import { HideOnReview } from '../../components/ios/HideOnReview';
import { DesktopNFTS } from './DesktopNft';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../state/tonendpoint';
import { Navigate } from '../../components/shared/Navigate';
import { AppRoute } from '../../libs/routes';

export const DesktopDns = () => {
    const { t } = useTranslation();
    const { data: nfts } = useWalletFilteredNftList();
    const filteredNft = useMemo(
        () =>
            nfts?.filter(
                nft =>
                    nft.collection?.address &&
                    KnownNFTDnsCollections.includes(nft.collection.address)
            ),
        [nfts]
    );

    const isEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.NFT);
    if (!isEnabled) {
        return <Navigate to={AppRoute.home} />;
    }

    return (
        <HideOnReview>
            <DesktopNFTS
                nfts={filteredNft}
                emptyPageTitle={t('domains_empty_header')}
                pageTitle={t('wallet_aside_domains')}
            />
        </HideOnReview>
    );
};
