import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { FC } from 'react';
import { HomeSkeleton } from '../../components/Skeleton';
import { Balance } from '../../components/home/Balance';
import { CompactView } from '../../components/home/CompactView';
import { TabsView } from '../../components/home/TabsView';
import { HomeActions } from '../../components/home/TonActions';
import { usePreFetchRates } from '../../state/rates';

import { useWalletFilteredNftList } from '../../state/nft';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../state/tonendpoint';
import { MobileCancelLegacySubscriptionBanner } from '../../components/legacy-plugins/MobileCancelLegacySubscriptionBanner';
import {
    PortfolioBalance,
    usePortfolioBalancesForList
} from '../../state/portfolio/usePortfolioBalances';

const HomeAssets: FC<{
    balances: PortfolioBalance[];
    nfts: NFT[];
}> = ({ balances, nfts }) => {
    const isNftEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.NFT);

    if (balances.length + nfts.length < 11 || balances.length < 4 || !isNftEnabled) {
        return <CompactView balances={balances} nfts={nfts} />;
    } else {
        return <TabsView balances={balances} nfts={nfts} />;
    }
};

const Home = () => {
    const { isFetched } = usePreFetchRates();

    const { data: balances, tokenError } = usePortfolioBalancesForList();

    const { data: nfts, isFetching: isNftLoading } = useWalletFilteredNftList();

    const isLoading = !balances || isNftLoading;

    if (!nfts || !balances || !isFetched) {
        return <HomeSkeleton />;
    }

    return (
        <>
            <MobileCancelLegacySubscriptionBanner />
            <Balance error={tokenError} isFetching={isLoading} />
            <HomeActions chain={BLOCKCHAIN_NAME.TON} />
            <HomeAssets balances={balances} nfts={nfts} />
        </>
    );
};

export default Home;
