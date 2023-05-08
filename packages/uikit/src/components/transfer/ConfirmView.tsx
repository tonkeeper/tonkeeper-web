import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AmountData, RecipientData } from '@tonkeeper/core/dist/entries/send';
import { sendJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { sendTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { DefaultDecimals } from '@tonkeeper/core/dist/utils/send';

import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import React, { FC, useMemo, useState } from 'react';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { formatter } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { getWalletPassword } from '../../state/password';
import { useTonenpointStock } from '../../state/tonendpoint';
import { TransferComment } from '../activity/ActivityActionDetails';
import { ActionFeeDetails } from '../activity/NotificationCommon';
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
import {
  ButtonBlock,
  notifyError,
  ResultButton,
  useFiatAmount,
} from './common';
import { Image, ImageMock, Info, SendingTitle, Title } from './Confirm';
import { AmountListItem, RecipientListItem } from './ConfirmListItem';

const useSendTransaction = (
  recipient: RecipientData,
  amount: AmountData,
  jettons: JettonsBalances
) => {
  const { t } = useTranslation();
  const sdk = useAppSdk();
  const { tonApi } = useAppContext();
  const wallet = useWalletContext();
  const client = useQueryClient();

  return useMutation<boolean, Error>(async () => {
    const password = await getWalletPassword(sdk, 'confirm').catch(() => null);
    if (password === null) return false;
    try {
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
    } catch (e) {
      await notifyError(client, sdk, t, e);
    }

    await client.invalidateQueries([wallet.active.rawAddress]);
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

  const { standalone, fiat } = useAppContext();
  const { data: stock } = useTonenpointStock();

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

  const [jettonImage, title, symbol, decimals] = useMemo(() => {
    if (amount.jetton === CryptoCurrency.TON) {
      return [
        '/img/toncoin.svg',
        t('txActions_signRaw_types_tonTransfer'),
        CryptoCurrency.TON.toString(),
        DefaultDecimals,
      ] as const;
    }

    const jetton = jettons.balances.find(
      (item) => item.jettonAddress === amount.jetton
    );

    return [
      jetton?.metadata?.image,
      t('txActions_signRaw_types_jettonTransfer'),
      jetton?.metadata?.symbol ?? amount.jetton,
      jetton?.metadata?.decimals ?? DefaultDecimals,
    ] as const;
  }, [amount.jetton, jettons, t]);

  const fiatAmount = useFiatAmount(
    jettons,
    amount.jetton,
    amount.amount.toFormat()
  );

  const coinAmount = `${formatter.format(amount.amount, {
    ignoreZeroTruncate: false,
    decimals,
  })} ${symbol}`;

  return (
    <FullHeightBlock onSubmit={onSubmit} standalone={standalone}>
      <NotificationTitleBlock>
        <BackButton onClick={onBack}>
          <ChevronLeftIcon />
        </BackButton>
        <NotificationCancelButton handleClose={onClose} />
      </NotificationTitleBlock>
      <Info>
        {recipient.toAccount.icon ? (
          <Image full src={recipient.toAccount.icon} />
        ) : jettonImage ? (
          <Image full src={jettonImage} />
        ) : (
          <ImageMock full />
        )}
        <SendingTitle>{t('confirm_sending_title')}</SendingTitle>
        <Title>
          {recipient.toAccount.name ? recipient.toAccount.name : title}
        </Title>
      </Info>
      <ListBlock margin={false} fullWidth>
        <RecipientListItem recipient={recipient} />
        <AmountListItem coinAmount={coinAmount} fiatAmount={fiatAmount} />
        <ActionFeeDetails fee={amount.fee} stock={stock} fiat={fiat} />
        <TransferComment comment={recipient.comment} />
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
