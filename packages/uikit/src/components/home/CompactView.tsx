import { NFT } from '@tonkeeper/core/dist/entries/nft';
import React, { FC, ReactNode } from 'react';
import { NftsList } from '../nft/Nfts';
import { JettonList } from './Jettons';
import { PortfolioBalance } from '../../state/portfolio/usePortfolioBalances';

export const CompactView: FC<{
    balances: PortfolioBalance[];
    nfts: NFT[];
    collectiblesAccessory?: ReactNode;
}> = ({ balances, nfts, collectiblesAccessory }) => {
    return (
        <>
            <JettonList balances={balances} />
            {collectiblesAccessory}
            <NftsList nfts={nfts} />
        </>
    );
};
