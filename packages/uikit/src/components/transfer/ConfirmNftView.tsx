import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import { sendNftTransfer } from '@tonkeeper/core/dist/service/transfer/nftService';
import { Fee, NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useMemo, useState } from 'react';
import { Address } from 'ton-core';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { getWalletPassword } from '../../state/password';
import { TransferComment } from '../activity/ActivityActionDetails';
import { BackButton } from '../fields/BackButton';
import { Button } from '../fields/Button';
import {
  CheckmarkCircleIcon,
  ChevronLeftIcon,
  ExclamationMarkCircleIcon,
} from '../Icon';
import { Gap } from '../Layout';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import {
  FullHeightBlock,
  NotificationCancelButton,
  NotificationTitleBlock,
} from '../Notification';
import { Label1, Label2 } from '../Text';
import { ButtonBlock, Label, ResultButton, useFaitTonAmount } from './common';

import { Image, ImageMock, Info, SendingTitle, Title } from './Confirm';
import { FeeListItem, RecipientListItem } from './ConfirmListItem';

const useSendNft = (
  recipient: RecipientData,
  nftItem: NftItemRepr,
  fee?: Fee
) => {
  const sdk = useAppSdk();
  const { tonApi } = useAppContext();
  const wallet = useWalletContext();
  const client = useQueryClient();

  return useMutation<void, Error>(async () => {
    if (!fee) return;
    const password = await getWalletPassword(sdk);
    await sendNftTransfer(
      sdk.storage,
      tonApi,
      wallet,
      recipient,
      nftItem,
      fee,
      password
    );

    await client.invalidateQueries();
  });
};

export const ConfirmNftView: FC<{
  recipient: RecipientData;
  nftItem: NftItemRepr;
  fee?: Fee;
  onBack: () => void;
  onClose: () => void;
  width: number;
}> = ({ recipient, onBack, onClose, width, nftItem, fee }) => {
  const [done, setDone] = useState(false);
  const { t } = useTranslation();
  const sdk = useAppSdk();

  const { mutateAsync, isLoading, error } = useSendNft(recipient, nftItem, fee);

  const isValid = !isLoading;

  const format = useFormatCoinValue();
  const feeAmount = useMemo(() => format(fee?.total ?? 0), [format, fee]);
  const fiatFeeAmount = useFaitTonAmount(feeAmount);

  const image = nftItem.previews?.find((item) => item.resolution === '100x100');

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isLoading) return;
    try {
      await mutateAsync();
      setDone(true);
      setTimeout(onClose, 2000);
    } catch (e) {}
  };

  return (
    <FullHeightBlock onSubmit={onSubmit}>
      <NotificationTitleBlock>
        <BackButton onClick={onBack}>
          <ChevronLeftIcon />
        </BackButton>
        <NotificationCancelButton handleClose={onClose} />
      </NotificationTitleBlock>
      <Info>
        {image ? <Image src={image.url} /> : <ImageMock />}
        <SendingTitle>{nftItem.dns ?? nftItem.metadata.name}</SendingTitle>
        <Title>{t('txActions_signRaw_types_nftItemTransfer')}</Title>
      </Info>
      <ListBlock margin={false} fullWidth>
        <RecipientListItem recipient={recipient} />
        <FeeListItem feeAmount={feeAmount} fiatFeeAmount={fiatFeeAmount} />
        <TransferComment comment={recipient.comment} />
      </ListBlock>

      <ListBlock fullWidth>
        {nftItem.collection && (
          <ListItem
            onClick={() =>
              sdk.copyToClipboard(
                Address.parse(nftItem.collection!.address).toString()
              )
            }
          >
            <ListItemPayload>
              <Label>{t('NFT_collection_id')}</Label>
              <Label1>{toShortAddress(nftItem.collection!.address)}</Label1>
            </ListItemPayload>
          </ListItem>
        )}
        <ListItem
          onClick={() =>
            sdk.copyToClipboard(Address.parse(nftItem.address).toString())
          }
        >
          <ListItemPayload>
            <Label>{t('NFT_item_id')}</Label>
            <Label1>{toShortAddress(nftItem.address)}</Label1>
          </ListItemPayload>
        </ListItem>
      </ListBlock>
      <Gap />

      <ButtonBlock width={width}>
        {done && (
          <ResultButton done>
            <CheckmarkCircleIcon />
            <Label2>{t('send_screen_steps_done_done_label')}</Label2>
          </ResultButton>
        )}
        {error && (
          <ResultButton>
            <ExclamationMarkCircleIcon />
            <Label2>{t('send_publish_tx_error')}</Label2>
          </ResultButton>
        )}
        {!done && !error && (
          <Button
            fullWidth
            size="large"
            primary
            type="submit"
            disabled={!isValid}
            loading={isLoading || fee == undefined}
          >
            {t('confirm_sending_submit')}
          </Button>
        )}
      </ButtonBlock>
    </FullHeightBlock>
  );
};
