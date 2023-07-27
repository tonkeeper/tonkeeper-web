import { NFT } from '@tonkeeper/core/dist/entries/nft';
import React, { FC, useMemo } from 'react';
import { HomeSkeleton } from '../../components/Skeleton';
import { Balance } from '../../components/home/Balance';
import { CompactView } from '../../components/home/CompactView';
import { AssetData } from '../../components/home/Jettons';
import { DateSyncBanner } from '../../components/home/SyncBunner';
import { TabsView } from '../../components/home/TabsView';
import { HomeActions } from '../../components/home/TonActions';
import { useWalletContext } from '../../hooks/appContext';
import { filterTonAssetList } from '../../state/jetton';
import { usePreFetchRates } from '../../state/rates';
import { useTonenpointStock } from '../../state/tonendpoint';
import { useTronBalances } from '../../state/tron';
import { useWalletAccountInfo, useWalletJettonList, useWalletNftList } from '../../state/wallet';

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
    const { data: stock, isFetching: isStockLoading } = useTonenpointStock();
    const wallet = useWalletContext();

    usePreFetchRates();
    const { data: info, error, isFetching: isAccountLoading } = useWalletAccountInfo();
    const { data: jettons, isFetching: isJettonLoading } = useWalletJettonList();
    const { data: nfts, isFetching: isNftLoading } = useWalletNftList();
    const { data: tronBalances, isFetching: isTronLoading } = useTronBalances();

    const isLoading =
        isJettonLoading || isAccountLoading || isNftLoading || isStockLoading || isTronLoading;

    const assets = useMemo<AssetData | undefined>(() => {
        if (!info || !jettons || !stock || !tronBalances) return undefined;
        return {
            stock,
            ton: { info, jettons: filterTonAssetList(jettons, wallet) },
            tron: tronBalances
        };
    }, [info, jettons, stock, wallet, tronBalances]);

    if (!nfts || !assets) {
        return <HomeSkeleton />;
    }

    return (
        <>
            <DateSyncBanner />
            <Balance
                info={info}
                error={error}
                stock={stock}
                jettons={jettons}
                isFetching={isLoading}
            />
            <HomeActions />
            <HomeAssets assets={assets} nfts={nfts} />
        </>
    );
};

export default Home;
