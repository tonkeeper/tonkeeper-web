import { NftItemRepr, NftItemsRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, {
  FC,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import styled, { css } from 'styled-components';
import { AppSelectionContext, useAppContext } from '../../hooks/appContext';
import { NftCollectionBody3, NftHeaderLabel2 } from './NftHeader';
import { NftNotification } from './NftNotification';

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

export const NftItem: FC<{
  nft: NftItemRepr;
  resolution: string;
  onOpen: (nft: NftItemRepr) => void;
}> = React.memo(({ nft, resolution, onOpen }) => {
  const image = nft.previews?.find((item) => item.resolution === resolution);
  const { ios } = useAppContext();
  const [isHover, setHover] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);
  const selection = useContext(AppSelectionContext);
  useLayoutEffect(() => {
    if (ref.current && selection && ref.current.contains(selection as Node)) {
      setHover(true);
    } else {
      setHover(false);
    }
  }, [ref.current, selection, setHover]);

  return (
    <NftBlock
      hover
      isHover={isHover}
      ios={ios}
      ref={ref}
      onClick={() => onOpen(nft)}
    >
      <Image url={image?.url} />
      <Text>
        <NftHeaderLabel2 nft={nft} />
        <NftCollectionBody3 nft={nft} />
      </Text>
    </NftBlock>
  );
});

export const NftsList: FC<{ nfts: NftItemsRepr | undefined }> = ({ nfts }) => {
  const [nftItem, setNftItem] = useState<NftItemRepr | undefined>(undefined);

  return (
    <>
      <Grid>
        {(nfts?.nftItems ?? []).map((item) => (
          <NftItem
            key={item.address}
            nft={item}
            resolution="500x500"
            onOpen={setNftItem}
          />
        ))}
      </Grid>
      <NftNotification
        nftItem={nftItem}
        handleClose={() => setNftItem(undefined)}
      />
    </>
  );
};
