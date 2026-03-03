import { NFT } from '@tonkeeper/core/dist/entries/nft';
import React, { FC } from 'react';
import { NftsList } from '../nft/Nfts';
import { JettonList } from './Jettons';
import { PortfolioBalance } from '../../state/portfolio/usePortfolioBalances';

export const CompactView: FC<{
    balances: PortfolioBalance[];
    nfts: NFT[];
}> = ({ balances, nfts }) => {
    return (
        <>
            <JettonList balances={balances} />
            <NftsList nfts={nfts} />
        </>
    );
};
