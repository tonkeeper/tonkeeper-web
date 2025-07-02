import { useTranslation } from '../../hooks/translation';
import { useWalletFilteredNftList } from '../../state/nft';
import { useMemo } from 'react';
import { KnownNFTDnsCollections } from '../../components/nft/NftView';
import { DesktopNFTS } from './DesktopNft';

export const DesktopCollectables = () => {
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

    return (
        <DesktopNFTS
            nfts={filteredNft}
            emptyPageTitle={t('collectibles_empty_header')}
            pageTitle={t('wallet_aside_collectibles')}
        />
    );
};
