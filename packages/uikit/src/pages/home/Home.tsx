import {
  AccountRepr,
  JettonsBalances,
  NftItemsRepr,
} from '@tonkeeper/core/dist/tonApiV1';
import { TonendpointStock } from '@tonkeeper/core/dist/tonkeeperApi/stock';
import React, { FC } from 'react';
import { Balance } from '../../components/home/Balance';
import { CompactView } from '../../components/home/CompactView';
import { TabsView } from '../../components/home/TabsView';
import { HomeActions } from '../../components/home/TonActions';
import { HomeSkeleton } from '../../components/Skeleton';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useUserJettonList } from '../../state/jetton';
import { useTonenpointStock } from '../../state/tonendpoint';
import {
  checkWalletBackup,
  useWalletAccountInfo,
  useWalletJettonList,
  useWalletNftList,
} from '../../state/wallet';

const HomeAssets: FC<{
  stock: TonendpointStock;
  jettons: JettonsBalances;
  info: AccountRepr;
  nfts: NftItemsRepr;
}> = ({ stock, jettons, info, nfts }) => {
  const filtered = useUserJettonList(jettons);

  if (filtered.balances.length + nfts.nftItems.length < 10) {
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

  const { data: stock } = useTonenpointStock();

  const { data: info, error } = useWalletAccountInfo();
  const { data: jettons } = useWalletJettonList();
  const { data: nfts } = useWalletNftList();

  checkWalletBackup();

  if (!stock || !nfts || !jettons || !info) {
    return <HomeSkeleton />;
  }

  return (
    <>
      <Balance
        address={wallet.active.friendlyAddress}
        currency={fiat}
        info={info}
        error={error}
        stock={stock}
        jettons={jettons}
      />
      <HomeActions />
      <HomeAssets info={info} jettons={jettons} nfts={nfts} stock={stock} />
    </>
  );
};

export default Home;
