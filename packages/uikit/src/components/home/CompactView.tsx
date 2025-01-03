import { NFT } from '@tonkeeper/core/dist/entries/nft';
import React, { FC } from 'react';
import { NftsList } from '../nft/Nfts';
import { JettonList } from './Jettons';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';

export const CompactView: FC<{
    assets: AssetAmount[];
    nfts: NFT[];
}> = ({ assets, nfts }) => {
    return (
        <>
            <JettonList assets={assets} />
            <NftsList nfts={nfts} />
        </>
    );
};
