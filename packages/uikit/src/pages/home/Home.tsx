import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { FC } from 'react';
import { HomeSkeleton } from '../../components/Skeleton';
import { Balance } from '../../components/home/Balance';
import { CompactView } from '../../components/home/CompactView';
import { TabsView } from '../../components/home/TabsView';
import { HomeActions } from '../../components/home/TonActions';
import { useAllChainsAssets } from '../../state/home';
import { usePreFetchRates } from '../../state/rates';

import { useWalletFilteredNftList } from '../../state/nft';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../state/tonendpoint';

const HomeAssets: FC<{
    assets: AssetAmount[];
    nfts: NFT[];
}> = ({ assets, nfts }) => {
    const isNftEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.NFT);

    if (assets.length + nfts.length < 11 || assets.length < 4 || !isNftEnabled) {
        return <CompactView assets={assets} nfts={nfts} />;
    } else {
        return <TabsView assets={assets} nfts={nfts} />;
    }
};

const Home = () => {
    const { isFetched } = usePreFetchRates();

    const { assets, error } = useAllChainsAssets();

    const { data: nfts, isFetching: isNftLoading } = useWalletFilteredNftList();

    const isLoading = !assets || isNftLoading;

    if (!nfts || !assets || !isFetched) {
        return <HomeSkeleton />;
    }

    return (
        <>
            <Balance error={error} isFetching={isLoading} />
            <HomeActions chain={BLOCKCHAIN_NAME.TON} />
            <HomeAssets assets={assets} nfts={nfts} />
        </>
    );
};

export default Home;
