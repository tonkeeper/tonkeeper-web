import {
  AccountRepr,
  JettonsBalances,
  NftItemsRepr,
} from '@tonkeeper/core/dist/tonApiV1';
import { TonendpointStock } from '@tonkeeper/core/dist/tonkeeperApi/stock';
import React, { FC } from 'react';
import { Balance } from '../../components/home/Balance';
import { CompactView } from '../../components/home/CompactView';
import { DateSyncBanner } from '../../components/home/SyncBunner';
import { TabsView } from '../../components/home/TabsView';
import { HomeActions } from '../../components/home/TonActions';
import { HomeSkeleton } from '../../components/Skeleton';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useUserJettonList } from '../../state/jetton';
import { useTonenpointStock } from '../../state/tonendpoint';
import {
  useWalletAccountInfo,
  useWalletJettonList,
  useWalletNftList,
} from '../../state/wallet';
import {NFT} from "@tonkeeper/core/dist/entries/nft";

const HomeAssets: FC<{
  stock: TonendpointStock;
  jettons: JettonsBalances;
  info: AccountRepr;
  nfts: NFT[];
}> = ({ stock, jettons, info, nfts }) => {
  const filtered = useUserJettonList(jettons);

  if (
    filtered.balances.length + nfts.length < 10 ||
    filtered.balances.length < 3
  ) {
    return (
      <CompactView info={info} jettons={filtered} nfts={nfts} stock={stock} />
    );
  } else {
    return (
      <TabsView info={info} jettons={filtered} nfts={nfts} stock={stock} />
    );
  }
};

const Home = () => {
  const wallet = useWalletContext();
  const { fiat } = useAppContext();

  const { data: stock, isFetching: isStockLoading } = useTonenpointStock();

  const {
    data: info,
    error,
    isFetching: isAccountLoading,
  } = useWalletAccountInfo();
  const { data: jettons, isFetching: isJettonLoading } = useWalletJettonList();
  const { data: nfts, isFetching: isNftLoading } = useWalletNftList();

  const isLoading =
    isJettonLoading || isAccountLoading || isNftLoading || isStockLoading;

  if (!stock || !nfts || !jettons || !info) {
    return <HomeSkeleton />;
  }

  return (
    <>
      <DateSyncBanner />
      <Balance
        address={wallet.active.friendlyAddress}
        currency={fiat}
        info={info}
        error={error}
        stock={stock}
        jettons={jettons}
        isFetching={isLoading}
      />
      <HomeActions />
      <HomeAssets info={info} jettons={jettons} nfts={nfts} stock={stock} />
    </>
  );
};

export default Home;
