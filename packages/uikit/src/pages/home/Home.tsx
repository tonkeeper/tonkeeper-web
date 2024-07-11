import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { FC } from 'react';
import { HomeSkeleton } from '../../components/Skeleton';
import { Balance } from '../../components/home/Balance';
import { CompactView } from '../../components/home/CompactView';
import { AssetData } from '../../components/home/Jettons';
import { TabsView } from '../../components/home/TabsView';
import { HomeActions } from '../../components/home/TonActions';
import { useAssets } from '../../state/home';
import { usePreFetchRates } from '../../state/rates';

import { useWalletFilteredNftList } from "../../state/nft";

const HomeAssets: FC<{
    assets: AssetData;
    nfts: NFT[];
}> = ({ assets, nfts }) => {
    if (
        assets.ton.jettons.balances.length + nfts.length < 10 ||
        assets.ton.jettons.balances.length < 3
    ) {
        return <CompactView assets={assets} nfts={nfts} />;
    } else {
        return <TabsView assets={assets} nfts={nfts} />;
    }
};

const Home = () => {
    const { isFetched } = usePreFetchRates();

    const [assets, error, isAssetLoading, jettonError] = useAssets();

    const { data: nfts, error: nftError, isFetching: isNftLoading } = useWalletFilteredNftList();

    const isLoading = isAssetLoading || isNftLoading;

    if (!nfts || !assets || !isFetched) {
        return <HomeSkeleton />;
    }

    return (
        <>
            <Balance assets={assets} error={error} isFetching={isLoading} />
            {/* TODO: ENABLE TRON */}
            <HomeActions chain={BLOCKCHAIN_NAME.TON} />
            <HomeAssets assets={assets} nfts={nfts} />
        </>
    );
};

export default Home;
