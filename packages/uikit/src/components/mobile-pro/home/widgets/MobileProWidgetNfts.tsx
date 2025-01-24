import React, { FC } from 'react';
import styled from 'styled-components';
import { WidgetHeader } from './common';
import { AppRoute } from '../../../../libs/routes';
import { useTranslation } from '../../../../hooks/translation';
import { NftItemView } from '../../../nft/Nfts';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { useAppSdk } from '../../../../hooks/appSdk';

const Wrapper = styled.div`
    padding: 0.5rem 0 1rem;
`;

const NftGrid = styled.div`
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding: 0 1rem;
`;

export const MobileProWidgetNfts: FC<{ className?: string; nfts: NFT[] }> = ({
    className,
    nfts
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    return (
        <Wrapper className={className}>
            <WidgetHeader to={AppRoute.purchases}>{t('wallet_aside_collectibles')}</WidgetHeader>
            <NftGrid>
                {nfts.slice(0, 3).map(item => (
                    <NftItemView
                        key={item.address}
                        nft={item}
                        resolution="500x500"
                        onOpen={() => sdk.openNft(item)}
                    />
                ))}
            </NftGrid>
        </Wrapper>
    );
};
