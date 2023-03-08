import { AmountData, RecipientData } from '@tonkeeper/core/dist/entries/send';
import { JettonsBalances } from '@tonkeeper/core/dist/tonApi';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import { getJettonSymbol, TONAsset } from '@tonkeeper/core/dist/utils/send';
import React, { FC, useMemo } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { TransferComment } from '../activity/ActivityActionDetails';
import { BackButton } from '../fields/BackButton';
import { Button } from '../fields/Button';
import { ChevronLeftIcon } from '../Icon';
import { ColumnText, Gap } from '../Layout';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import {
  FullHeightBlock,
  NotificationCancelButton,
  NotificationTitleBlock,
} from '../Notification';
import { Body1, H3, Label1 } from '../Text';
import { useFiatAmount } from './common';

const ButtonBlock = styled.div<{ width: number }>`
  position: fixed;
  bottom: 1rem;
  width: ${(props) => props.width}px;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
`;

const Image = styled.img`
  width: 96px;
  height: 96px;
  border-radius: ${(props) => props.theme.cornerFull};
`;

const ImageMock = styled.div`
  width: 96px;
  height: 96px;
  border-radius: ${(props) => props.theme.cornerFull};
  background: ${(props) => props.theme.backgroundContent};
`;

const SendingTitle = styled(Body1)`
  user-select: none;
  color: ${(props) => props.theme.textSecondary};
  margin: 20px 0 4px;
`;

const Label = styled(Body1)`
  user-select: none;
  color: ${(props) => props.theme.textSecondary};
`;

export const ConfirmView: FC<{
  recipient: RecipientData;
  amount: AmountData;
  jettons: JettonsBalances;
  onBack: () => void;
  onClose: () => void;
  width: number;
}> = ({ recipient, onBack, onClose, width, amount, jettons }) => {
  const { t } = useTranslation();
  const sdk = useAppSdk();

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.stopPropagation();
  };

  const isValid = false;

  const fiatAmount = useFiatAmount(jettons, amount.jetton, amount.amount);
  const coinAmount = `${amount.amount} ${getJettonSymbol(
    amount.jetton,
    jettons
  )}`;

  const format = useFormatCoinValue();
  const feeAmount = useMemo(() => format(amount.fee.total), [format, amount]);
  const fiatFeeAmount = useFiatAmount(jettons, TONAsset, feeAmount);

  return (
    <FullHeightBlock onSubmit={onSubmit}>
      <NotificationTitleBlock>
        <BackButton onClick={onBack}>
          <ChevronLeftIcon />
        </BackButton>
        <NotificationCancelButton handleClose={onClose} />
      </NotificationTitleBlock>
      <Info>
        {recipient.toAccount.icon ? (
          <Image src={recipient.toAccount.icon} />
        ) : (
          <ImageMock />
        )}
        <SendingTitle>{t('confirm_sending_title')}</SendingTitle>
        <H3>
          {recipient.toAccount.name
            ? recipient.toAccount.name
            : t('txActions_signRaw_types_tonTransfer')}
        </H3>
      </Info>
      <ListBlock margin={false} fullWidth>
        <ListItem
          onClick={() => sdk.copyToClipboard(recipient.address.address)}
        >
          <ListItemPayload>
            <Label>{t('txActions_signRaw_recipient')}</Label>
            <Label1>{toShortAddress(recipient.address.address)}</Label1>
          </ListItemPayload>
        </ListItem>
        <ListItem onClick={() => sdk.copyToClipboard(coinAmount)}>
          <ListItemPayload>
            <Label>{t('txActions_amount')}</Label>
            {fiatAmount ? (
              <ColumnText
                right
                text={coinAmount}
                secondary={<>≈&thinsp;{fiatAmount}</>}
              />
            ) : (
              <Label1>{coinAmount}</Label1>
            )}
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
        <Button
          fullWidth
          size="large"
          primary
          type="submit"
          disabled={!isValid}
        >
          {t('confirm_sending_submit')}
        </Button>
      </ButtonBlock>
    </FullHeightBlock>
  );
};
