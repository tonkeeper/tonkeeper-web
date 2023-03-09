import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import { TONAsset } from '@tonkeeper/core/dist/utils/send';
import React, { FC, useMemo, useState } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { TransferComment } from '../activity/ActivityActionDetails';
import { BackButton } from '../fields/BackButton';
import { Button } from '../fields/Button';
import {
  CheckmarkCircleIcon,
  ChevronLeftIcon,
  ExclamationMarkCircleIcon,
} from '../Icon';
import { ColumnText, Gap } from '../Layout';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import {
  FullHeightBlock,
  NotificationCancelButton,
  NotificationTitleBlock,
} from '../Notification';
import { Label1, Label2 } from '../Text';
import { ButtonBlock, Label, ResultButton, useFaitTonAmount } from './common';

export const ConfirmNftView: FC<{
  recipient: RecipientData;
  nftItem: NftItemRepr;
  onBack: () => void;
  onClose: () => void;
  width: number;
}> = ({ recipient, onBack, onClose, width, nftItem }) => {
  const [done, setDone] = useState(false);
  const { t } = useTranslation();
  const sdk = useAppSdk();

  const isLoading = false;
  const error = null;

  const isValid = !isLoading;

  const format = useFormatCoinValue();
  const feeAmount = useMemo(() => format(1000), [format]);
  const fiatFeeAmount = useFaitTonAmount(feeAmount);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isLoading) return;
    try {
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

      <ListBlock margin={false} fullWidth>
        <ListItem
          onClick={() => sdk.copyToClipboard(recipient.address.address)}
        >
          <ListItemPayload>
            <Label>{t('txActions_signRaw_recipient')}</Label>
            <Label1>{toShortAddress(recipient.address.address)}</Label1>
          </ListItemPayload>
        </ListItem>
        <ListItem
          onClick={() => sdk.copyToClipboard(`${feeAmount} ${TONAsset}`)}
        >
          <ListItemPayload>
            <Label>{t('txActions_fee')}</Label>
            <ColumnText
              right
              text={
                <>
                  ≈&thinsp;{feeAmount} {TONAsset}
                </>
              }
              secondary={<>≈&thinsp;{fiatFeeAmount}</>}
            />
          </ListItemPayload>
        </ListItem>
        <TransferComment comment={recipient.comment} />
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
            loading={isLoading}
          >
            {t('confirm_sending_submit')}
          </Button>
        )}
      </ButtonBlock>
    </FullHeightBlock>
  );
};
