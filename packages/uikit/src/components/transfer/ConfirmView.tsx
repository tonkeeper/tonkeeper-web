import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AmountData, RecipientData } from '@tonkeeper/core/dist/entries/send';
import { sendJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { sendTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { getJettonSymbol } from '@tonkeeper/core/dist/utils/send';

import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import React, { FC, useMemo, useState } from 'react';
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
import { ListBlock } from '../List';
import {
  FullHeightBlock,
  NotificationCancelButton,
  NotificationTitleBlock,
} from '../Notification';
import { Label2 } from '../Text';
import { ButtonBlock, ResultButton, useFiatAmount } from './common';
import { Image, ImageMock, Info, SendingTitle, Title } from './Confirm';
import {
  AmountListItem,
  FeeListItem,
  RecipientListItem,
} from './ConfirmListItem';

const useSendTransaction = (
  recipient: RecipientData,
  amount: AmountData,
  jettons: JettonsBalances
) => {
  const sdk = useAppSdk();
  const { tonApi } = useAppContext();
  const wallet = useWalletContext();
  const client = useQueryClient();

  return useMutation<boolean, Error>(async () => {
    const password = await getWalletPassword(sdk, 'confirm').catch(() => null);
    if (password === null) return false;
    if (amount.jetton === CryptoCurrency.TON) {
      await sendTonTransfer(
        sdk.storage,
        tonApi,
        wallet,
        recipient,
        amount,
        amount.fee,
        password
      );
    } else {
      const [jettonInfo] = jettons.balances.filter(
        (item) => item.jettonAddress === amount.jetton
      );
      await sendJettonTransfer(
        sdk.storage,
        tonApi,
        wallet,
        recipient,
        amount,
        jettonInfo,
        amount.fee,
        password
      );
    }
    await client.invalidateQueries();
    return true;
  });
};

export const ConfirmView: FC<{
  recipient: RecipientData;
  amount: AmountData;
  jettons: JettonsBalances;
  onBack: () => void;
  onClose: () => void;
}> = ({ recipient, onBack, onClose, amount, jettons }) => {
  const [done, setDone] = useState(false);
  const { t } = useTranslation();

  const { mutateAsync, isLoading, error, reset } = useSendTransaction(
    recipient,
    amount,
    jettons
  );

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isLoading) return;
    try {
      reset();
      const done = await mutateAsync();
      if (done) {
        setDone(true);
        setTimeout(onClose, 2000);
      }
    } catch (e) {}
  };

  const isValid = !isLoading;

  const fiatAmount = useFiatAmount(jettons, amount.jetton, amount.amount);
  const coinAmount = `${amount.amount} ${getJettonSymbol(
    amount.jetton,
    jettons
  )}`;

  const format = useFormatCoinValue();
  const feeAmount = useMemo(() => format(amount.fee.total), [format, amount]);
  const fiatFeeAmount = useFiatAmount(jettons, CryptoCurrency.TON, feeAmount);

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
          <Image full src={recipient.toAccount.icon} />
        ) : (
          <ImageMock full />
        )}
        <SendingTitle>{t('confirm_sending_title')}</SendingTitle>
        <Title>
          {recipient.toAccount.name
            ? recipient.toAccount.name
            : t('txActions_signRaw_types_tonTransfer')}
        </Title>
      </Info>
      <ListBlock margin={false} fullWidth>
        <RecipientListItem recipient={recipient} />
        <AmountListItem coinAmount={coinAmount} fiatAmount={fiatAmount} />
        <FeeListItem feeAmount={feeAmount} fiatFeeAmount={fiatFeeAmount} />
        <TransferComment
          comment={
            amount.jetton === CryptoCurrency.TON ? recipient.comment : undefined
          }
        />
      </ListBlock>
      <Gap />

      <ButtonBlock>
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
