import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, {
  FC,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import styled, { css } from 'styled-components';
import { AppSelectionContext, useAppContext } from '../../hooks/appContext';
import {FireBadgeIcon, SaleIcon} from '../Icon';
import { NftCollectionBody3, NftHeaderLabel2 } from './NftHeader';
import { NftNotification } from './NftNotification';
import {useNftDNSExpirationDate} from "../../state/wallet";

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

  background-color: ${(props) => props.theme.backgroundContent};
  transition: background-color 0.1s ease;

  border-radius: ${(props) => props.theme.cornerSmall};

  overflow: hidden;

  ${(props) => {
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
`

export const Image = styled.div<{ url?: string }>`
  width: 100%;
  padding-bottom: 100%;

  ${(props) =>
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

export const NftItem: FC<{
  nft: NftItemRepr;
  resolution: string;
  onOpen: (nft: NftItemRepr) => void;
}> = React.memo(({ nft, resolution, onOpen }) => {
  const isSale = nft.sale != undefined;
  const image = nft.previews?.find((item) => item.resolution === resolution);
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

  const isExpiring = expirationDate && expirationDate.getTime() <= Date.now() + 1000 * 3600 * 24 * 30;

  return (
    <NftBlock
      hover
      isHover={isHover}
      ios={ios}
      ref={ref}
      onClick={() => onOpen(nft)}
    >
      {isSale && (
        <SaleBlock>
          <SaleIcon />
        </SaleBlock>
      )}
      <ImageContainer>
        <Image url={image?.url} />
        {
          isExpiring && <ExpiringBlock><FireBadgeIcon /></ExpiringBlock>
        }
      </ImageContainer>
      <Text>
        <NftHeaderLabel2 nft={nft} />
        <NftCollectionBody3 nft={nft} />
      </Text>
    </NftBlock>
  );
});

export const NftsList: FC<{ nfts: NFT[] | undefined }> = ({ nfts }) => {
  const [nftItemAddress, setNftItemAddress] = useState<string | undefined>(
    undefined
  );

  const selectedNft = nftItemAddress
    ? nfts?.find((nft) => nft.address === nftItemAddress)
    : undefined;

  return (
    <>
      <Grid>
        {(nfts ?? []).map((item) => (
          <NftItem
            key={item.address}
            nft={item}
            resolution="500x500"
            onOpen={() => setNftItemAddress(item.address)}
          />
        ))}
      </Grid>
      <NftNotification
        nftItem={selectedNft}
        handleClose={() => setNftItemAddress(undefined)}
      />
    </>
  );
};
