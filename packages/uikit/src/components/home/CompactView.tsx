import {
  AccountRepr,
  JettonsBalances,
  NftItemsRepr,
} from '@tonkeeper/core/dist/tonApiV1';
import { TonendpointStock } from '@tonkeeper/core/dist/tonkeeperApi/stock';
import React, { FC } from 'react';
import { NftsList } from '../nft/Nfts';
import { JettonList } from './Jettons';
import {NFT} from "@tonkeeper/core/dist/entries/nft";

export const CompactView: FC<{
  stock: TonendpointStock;
  jettons: JettonsBalances;
  info: AccountRepr;
  nfts: NFT[];
}> = ({ stock, jettons, info, nfts }) => {
  return (
    <>
      <JettonList info={info} jettons={jettons} stock={stock} />
      <NftsList nfts={nfts} />
    </>
  );
};
