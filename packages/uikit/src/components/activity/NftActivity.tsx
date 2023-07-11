import { Action, NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import styled from 'styled-components';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useTonenpointStock } from '../../state/tonendpoint';
import { useNftItemData } from '../../state/wallet';
import { VerificationIcon } from '../Icon';
import { ListBlock } from '../List';
import { Body1 } from '../Text';
import { NftCollectionBody2, NftHeaderBody2 } from '../nft/NftHeader';
import { ActivityIcon, ReceiveIcon, SentIcon } from './ActivityIcons';
import { ActionData } from './ActivityNotification';
import {
  AmountText,
  Description,
  ErrorAction,
  FirstLabel,
  FirstLine,
  ListItemGrid,
  SecondLine,
  SecondaryText,
} from './CommonAction';
import {
  ActionDate,
  ActionDetailsBlock,
  ActionFeeDetails,
  ActionRecipientDetails,
  ActionSenderDetails,
  ActionTransactionDetails,
  ErrorActivityNotification,
  Title,
} from './NotificationCommon';

const NftBlock = styled.div`
  background: ${(props) => props.theme.backgroundContentTint};
  border-radius: ${(props) => props.theme.cornerExtraSmall};
  overflow: hidden;
  display: inline-flex;
  cursor: pointer;
  max-width: 100%;
`;

const NftText = styled.div`
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  white-space: nowrap;
  overflow: hidden;
  user-select: none;
`;

const Wrapper = styled.div`
  grid-column: 2 / 3;
  overflow: hidden;
`;

const NftImage = styled.img`
  user-select: none;
`;

export const NftComment: FC<{
  address: string;
  openNft: (nft: NftItemRepr) => void;
}> = ({ address, openNft }) => {
  const { data } = useNftItemData(address);

  if (!data) return <></>;
  const preview = data.previews?.find((item) => item.resolution === '100x100');
  return (
    <Wrapper>
      <NftBlock
        onClick={(e) => {
          e.stopPropagation();
          if (data) {
            openNft(data);
          }
        }}
      >
        {preview && <NftImage height="64" width="64" src={preview.url} />}
        <NftText>
          <NftHeaderBody2 nft={data} />
          <NftCollectionBody2 nft={data} />
        </NftText>
      </NftBlock>
    </Wrapper>
  );
};

export const NftItemTransferAction: FC<{
  action: Action;
  date: string;
  openNft: (nft: NftItemRepr) => void;
}> = ({ action, date, openNft }) => {
  const { t } = useTranslation();
  const wallet = useWalletContext();
  const { nftItemTransfer } = action;
  if (!nftItemTransfer) {
    return <ErrorAction />;
  }

  if (nftItemTransfer.recipient?.address === wallet.active.rawAddress) {
    return (
      <ListItemGrid>
        <ActivityIcon>
          <ReceiveIcon />
        </ActivityIcon>
        <Description>
          <FirstLine>
            <FirstLabel>{t('transaction_type_receive')}</FirstLabel>
            <AmountText></AmountText>
            <AmountText>NFT</AmountText>
          </FirstLine>
          <SecondLine>
            <SecondaryText>
              {nftItemTransfer.sender?.name ??
                toShortValue(
                  formatAddress(
                    nftItemTransfer.sender?.address ?? nftItemTransfer.nft,
                    wallet.network
                  )
                )}
            </SecondaryText>
            <SecondaryText>{date}</SecondaryText>
          </SecondLine>
        </Description>
        <NftComment address={nftItemTransfer.nft} openNft={openNft} />
      </ListItemGrid>
    );
  }

  return (
    <ListItemGrid>
      <ActivityIcon>
        <SentIcon />
      </ActivityIcon>
      <Description>
        <FirstLine>
          <FirstLabel>{t('transaction_type_sent')}</FirstLabel>
          <AmountText></AmountText>
          <AmountText>NFT</AmountText>
        </FirstLine>
        <SecondLine>
          <SecondaryText>
            {nftItemTransfer.recipient?.name ??
              toShortValue(
                formatAddress(
                  nftItemTransfer.recipient?.address ?? nftItemTransfer.nft,
                  wallet.network
                )
              )}
          </SecondaryText>
          <SecondaryText>{date}</SecondaryText>
        </SecondLine>
      </Description>
      <NftComment address={nftItemTransfer.nft} openNft={openNft} />
    </ListItemGrid>
  );
};

const Amount = styled(Body1)`
  display: block;
  user-select: none;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 4px;
`;

const Image = styled.img`
  width: 96px;
  width: 96px;
  margin-bottom: 20px;
  border-radius: ${(props) => props.theme.cornerMedium};
  user-select: none;
`;

const Icon = styled.span`
  position: relative;
  top: 3px;
  margin-left: 4px;
  user-select: none;
`;

export const NftItemTransferActionDetails: FC<ActionData> = ({
  action,
  timestamp,
  event,
}) => {
  const wallet = useWalletContext();
  const { nftItemTransfer } = action;

  const { fiat } = useAppContext();
  const { data: stock } = useTonenpointStock();
  const { data } = useNftItemData(nftItemTransfer?.nft);

  if (!nftItemTransfer) {
    return <ErrorActivityNotification event={event} />;
  }

  const preview = data?.previews?.find((item) => item.resolution === '100x100');

  if (nftItemTransfer.recipient?.address === wallet.active.rawAddress) {
    return (
      <ActionDetailsBlock event={event}>
        <div>
          {preview && <Image src={preview.url} alt="NFT Preview" />}
          {data && (
            <>
              <Title>{data.dns ?? data.metadata.name}</Title>
              <Amount>
                {data.collection?.name ?? data.metadata.description}
                {data && data.approvedBy && data.approvedBy.length > 0 && (
                  <Icon>
                    <VerificationIcon />
                  </Icon>
                )}
              </Amount>
            </>
          )}
          <ActionDate kind="received" timestamp={timestamp} />
        </div>
        <ListBlock margin={false} fullWidth>
          {nftItemTransfer.sender && (
            <ActionSenderDetails sender={nftItemTransfer.sender} />
          )}
          <ActionTransactionDetails event={event} />
          <ActionFeeDetails fee={event.fee} stock={stock} fiat={fiat} />
        </ListBlock>
      </ActionDetailsBlock>
    );
  }

  return (
    <ActionDetailsBlock event={event}>
      <div>
        {preview && <Image src={preview.url} alt="NFT Preview" />}
        {data && (
          <>
            <Title>{data.dns ?? data.metadata.name}</Title>
            <Amount>
              {data.collection?.name ?? data.metadata.description}
              {data && data.approvedBy && data.approvedBy.length > 0 && (
                <Icon>
                  <VerificationIcon />
                </Icon>
              )}
            </Amount>
          </>
        )}
        <ActionDate kind="send" timestamp={timestamp} />
      </div>
      <ListBlock margin={false} fullWidth>
        {nftItemTransfer.recipient && (
          <ActionRecipientDetails recipient={nftItemTransfer.recipient} />
        )}
        <ActionTransactionDetails event={event} />
        <ActionFeeDetails fee={event.fee} stock={stock} fiat={fiat} />
      </ListBlock>
    </ActionDetailsBlock>
  );
};
