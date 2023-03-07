import { JettonsBalances } from '@tonkeeper/core/dist/tonApi';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import { getJettonSymbol } from '@tonkeeper/core/dist/utils/send';
import React, { FC } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
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
import { AmountData } from './AmountView';
import { RecipientData } from './RecipientView';

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

  return (
    <FullHeightBlock onSubmit={onSubmit}>
      <NotificationTitleBlock>
        <BackButton onClick={onBack}>
          <ChevronLeftIcon />
        </BackButton>
        <NotificationCancelButton handleClose={onClose} />
      </NotificationTitleBlock>
      <Info>
        {recipient.logo ? <Image src={recipient.logo} /> : <ImageMock />}
        <SendingTitle>{t('confirm_sending_title')}</SendingTitle>
        <H3>
          {recipient.logo
            ? recipient.logo
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
        <ListItem>
          <ListItemPayload>
            <Label>{t('txActions_amount')}</Label>
            <ColumnText
              right
              text={`${amount.amount} ${getJettonSymbol(
                amount.jetton,
                jettons
              )}`}
              secondary={`≈`}
            />
          </ListItemPayload>
        </ListItem>
        <ListItem>
          <ListItemPayload>
            <Label>{t('txActions_fee')}</Label>
            <ColumnText right text={` TON`} secondary={`≈ `} />
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
