import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { NftItem } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC, useContext, useLayoutEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { AppSelectionContext, useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { toDaysLeft } from '../../hooks/dateFormat';
import { FireBadgeIcon, SaleIcon } from '../Icon';
import { NftCollectionBody3, NftHeaderLabel2 } from './NftHeader';
import { useNftDNSExpirationDate } from "../../state/nft";

const Grid = styled.div`
    display: grid;
    margin: 0 0 2rem 0;
    gap: 0.5rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
`;

export const NftBlock = styled.div<{
    hover?: boolean;
    isHover?: boolean;
    ios?: boolean;
}>`
    position: relative;
    user-select: none;
    width: 100%;
    display: flex;
    flex-direction: column;

    background-color: ${props => props.theme.backgroundContent};
    transition: background-color 0.1s ease;

    border-radius: ${props => props.theme.cornerSmall};

    overflow: hidden;

    ${props => {
        if (props.ios) {
            if (props.isHover) {
                return css`
                    background-color: ${props.theme.backgroundContentTint};
                `;
            }
        } else {
            if (!props.hover) {
                return undefined;
            } else {
                return css`
                    cursor: pointer;

                    &:hover {
                        background-color: ${props.theme.backgroundContentTint};
                    }
                `;
            }
        }
    }}
`;

const ImageContainer = styled.div`
    width: 100%;
    position: relative;
`;

export const Image = styled.div<{ url?: string }>`
    width: 100%;
    padding-bottom: 100%;

    ${props =>
        props.url &&
        css`
            background-image: url('${props.url}');
        `}
    background-size: cover;
`;

const Text = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0.75rem 0.5rem;
    white-space: nowrap;
`;

const SaleBlock = styled.div`
    position: absolute;
    top: 10px;
    right: 8px;
`;

const ExpiringBlock = styled.div`
    position: absolute;
    bottom: 0;
    right: 0;
    height: 32px;
    width: 32px;
`;

export const NftItemView: FC<{
    nft: NftItem;
    resolution: string;
    onOpen: (nft: NftItem) => void;
}> = React.memo(({ nft, resolution, onOpen }) => {
    const isSale = nft.sale !== undefined;
    const image = nft.previews?.find(item => item.resolution === resolution);
    const { ios } = useAppContext();
    const [isHover, setHover] = useState<boolean>(false);
    const ref = useRef<HTMLDivElement>(null);
    const selection = useContext(AppSelectionContext);
    const { data: expirationDate } = useNftDNSExpirationDate(nft);

    useLayoutEffect(() => {
        if (ref.current && selection && ref.current.contains(selection as Node)) {
            setHover(true);
        } else {
            setHover(false);
        }
    }, [ref.current, selection, setHover]);

    const isExpiring = expirationDate && Number(toDaysLeft(expirationDate)) <= 30;

    return (
        <NftBlock hover isHover={isHover} ios={ios} ref={ref} onClick={() => onOpen(nft)}>
            <ImageContainer>
                <Image url={image?.url} />
                {isSale && (
                    <SaleBlock>
                        <SaleIcon />
                    </SaleBlock>
                )}
                {isExpiring && (
                    <ExpiringBlock>
                        <FireBadgeIcon />
                    </ExpiringBlock>
                )}
            </ImageContainer>
            <Text>
                <NftHeaderLabel2 nft={nft} />
                <NftCollectionBody3 nft={nft} />
            </Text>
        </NftBlock>
    );
});

export const NftsList: FC<{ nfts: NFT[] | undefined; className?: string }> = ({
    nfts,
    className
}) => {
    const sdk = useAppSdk();
    return (
        <Grid className={className}>
            {(nfts ?? []).map(item => {
                if (item.metadata?.render_type === 'hidden') {
                    return <></>;
                }
                return (
                    <NftItemView
                        key={item.address}
                        nft={item}
                        resolution="500x500"
                        onOpen={() => sdk.openNft(item)}
                    />
                );
            })}
        </Grid>
    );
};
