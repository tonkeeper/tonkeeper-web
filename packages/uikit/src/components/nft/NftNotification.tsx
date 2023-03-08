import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { useFBAnalyticsEvent } from '../../hooks/analytics';
import { useTranslation } from '../../hooks/translation';
import { useNftCollectionData } from '../../state/wallet';
import { BackButton, ButtonMock } from '../fields/BackButton';
import { ChevronDownIcon, VerificationIcon } from '../Icon';
import { Body, CroppedBodyText } from '../jettons/CroppedText';
import {
  Notification,
  NotificationBlock,
  NotificationTitleBlock,
} from '../Notification';
import { H2, H3, Label1 } from '../Text';
import { NftAction } from './NftAction';
import { NftDetails } from './NftDetails';
import { Image, NftBlock } from './Nfts';

const Text = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.875rem 1rem;
`;

const Delimiter = styled.div`
  border-top: 1px solid ${(props) => props.theme.separatorCommon};
`;

const DelimiterExtra = styled.div`
  margin: 0 -1rem;
  width: 100%;
  border-top: 1px solid ${(props) => props.theme.separatorCommon};
`;

const CollectionTitle = styled(Label1)`
  margin-bottom: 0.5rem;
`;

const Icon = styled.span`
  position: relative;
  top: 3px;
  margin-left: 4px;
`;

const TonDnsRoot =
  '0:b774d95eb20543f186c06b371ab88ad704f7e256130caf96189368a7d0cb6ccf';

const NftPreview: FC<{
  onClose: () => void;
  nftItem: NftItemRepr;
}> = ({ onClose, nftItem }) => {
  const ref = useRef<HTMLImageElement | null>(null);
  const { t } = useTranslation();
  const { data: collection } = useNftCollectionData(nftItem);

  useFBAnalyticsEvent('screen_view');

  const { description } = nftItem.metadata;
  const name = nftItem.dns ?? nftItem.metadata.name;

  const itemKind = useMemo(() => {
    if (nftItem.collection?.address == TonDnsRoot) {
      return 'ton.dns';
    } else {
      return 'token';
    }
  }, [nftItem]);

  const collectionName = nftItem?.collection?.name;

  const image = nftItem.previews?.find(
    (item) => item.resolution === '1500x1500'
  );

  return (
    <NotificationBlock>
      <NotificationTitleBlock>
        <BackButton onClick={onClose}>
          <ChevronDownIcon />
        </BackButton>
        <H3>{nftItem.dns ?? nftItem.metadata.name}</H3>
        <ButtonMock />
      </NotificationTitleBlock>
      <NftBlock>
        {image && <Image ref={ref} url={image.url} />}
        <Text>
          <H2>{name}</H2>
          {collectionName && (
            <Body open margin="small">
              {collectionName}
              {nftItem.approvedBy && nftItem.approvedBy.length > 0 && (
                <Icon>
                  <VerificationIcon />
                </Icon>
              )}
            </Body>
          )}
          {description && (
            <CroppedBodyText text={description} margin="last" contentColor />
          )}
        </Text>
        {collection && collection.metadata.description && (
          <>
            <Delimiter />
            <Text>
              <CollectionTitle>{t('About_collection')}</CollectionTitle>
              <CroppedBodyText
                text={collection.metadata.description}
                margin="last"
                contentColor
              />
            </Text>
          </>
        )}
      </NftBlock>

      <NftAction nftItem={nftItem} kind={itemKind} />
      <DelimiterExtra />

      <NftDetails nftItem={nftItem} kind={itemKind} />
    </NotificationBlock>
  );
};
export const NftNotification: FC<{
  nftItem: NftItemRepr | undefined;
  handleClose: () => void;
}> = ({ nftItem, handleClose }) => {
  const Content = useCallback(() => {
    if (!nftItem) return undefined;
    console.log('nftItem', nftItem);
    return <NftPreview onClose={handleClose} nftItem={nftItem} />;
  }, [nftItem, handleClose]);

  return (
    <Notification
      isOpen={nftItem != undefined}
      hideButton
      handleClose={handleClose}
    >
      {Content}
    </Notification>
  );
};
