import React, { FC } from 'react';
import styled from 'styled-components';
import { WidgetHeader } from './common';
import { AppRoute } from '../../../../libs/routes';
import { useTranslation } from '../../../../hooks/translation';
import { NftItemView } from '../../../nft/Nfts';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { useAppSdk } from '../../../../hooks/appSdk';
import { Skeleton } from '../../../shared/Skeleton';

const Wrapper = styled.div`
    padding: 0.5rem 0 1rem;

    border-bottom: 1px solid ${p => p.theme.separatorCommon};
`;

const NftGrid = styled.div`
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding: 0 1rem;
`;

const SkeletonsGrid = styled.div`
    display: grid;
    gap: 0.5rem;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 0 1rem;

    > * {
        aspect-ratio: 1 / 1;
        height: unset;
        width: unset;
    }
`;

export const MobileProWidgetNfts: FC<{ className?: string; nfts?: NFT[] }> = ({
    className,
    nfts
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    return (
        <Wrapper className={className}>
            <WidgetHeader to={AppRoute.purchases}>{t('wallet_aside_collectibles')}</WidgetHeader>
            {nfts ? (
                <NftGrid>
                    {nfts.slice(0, 3).map(item => (
                        <NftItemView
                            key={item.address}
                            nft={item}
                            resolution="500x500"
                            hideText
                            onOpen={() => sdk.openNft(item)}
                        />
                    ))}
                </NftGrid>
            ) : (
                <SkeletonsGrid>
                    {[0, 1, 2].map((_, i) => (
                        <Skeleton key={i} />
                    ))}
                </SkeletonsGrid>
            )}
        </Wrapper>
    );
};
