import { NFT } from '@tonkeeper/core/dist/entries/nft';
import React, { FC } from 'react';
import { NftsList } from '../nft/Nfts';
import { AssetData, JettonList } from './Jettons';

export const CompactView: FC<{
    assets: AssetData;
    nfts: NFT[];
}> = ({ assets, nfts }) => {
    return (
        <>
            <JettonList assets={assets} />
            <NftsList nfts={nfts} />
        </>
    );
};
