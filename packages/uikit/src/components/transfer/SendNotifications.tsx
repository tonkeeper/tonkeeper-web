import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { AmountData, RecipientData } from '@tonkeeper/core/dist/entries/send';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import {
  parseTonTransfer,
  seeIfAddressEqual,
  TonTransferParams,
} from '@tonkeeper/core/dist/utils/common';
import { DefaultDecimals } from '@tonkeeper/core/dist/utils/send';
import React, { FC, useCallback, useRef, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { openIosKeyboard } from '../../hooks/ios';
import { useTranslation } from '../../hooks/translation';
import { useUserJettonList } from '../../state/jetton';
import { useWalletAccountInfo, useWalletJettonList } from '../../state/wallet';
import { Action } from '../home/Actions';
import { SendIcon } from '../home/HomeIcons';
import { Notification } from '../Notification';
import { AmountView } from './AmountView';
import { childFactoryCreator, duration, Wrapper } from './common';
import { ConfirmView } from './ConfirmView';
import { RecipientView, useGetToAccount } from './RecipientView';

const SendContent: FC<{ onClose: () => void; asset?: string }> = ({
  onClose,
  asset = CryptoCurrency.TON,
}) => {
  const sdk = useAppSdk();
  const { standalone, ios } = useAppContext();
  const { t } = useTranslation();
  const { data: jettons } = useWalletJettonList();
  const { data: info } = useWalletAccountInfo();
  const filter = useUserJettonList(jettons);

  const recipientRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  const [right, setRight] = useState(true);
  const [recipient, setRecipient] = useState<RecipientData | undefined>(
    undefined
  );
  const [amount, setAmount] = useState<AmountData | undefined>(undefined);

  const { mutateAsync: getAccountAsync, isLoading: isAccountLoading } =
    useGetToAccount();

  const onRecipient = (data: RecipientData) => {
    setRight(true);
    setRecipient(data);
  };

  const onAmount = (data: AmountData) => {
    setRight(true);
    setAmount(data);
  };

  const backToRecipient = useCallback(() => {
    setRight(false);
    setRecipient((value) => (value ? { ...value, done: false } : undefined));
  }, [setRecipient]);

  const backToAmount = useCallback(() => {
    if (ios) openIosKeyboard('decimal');
    setRight(false);
    setAmount((value) => (value ? { ...value, done: false } : undefined));
  }, [setAmount]);

  const processRecipient = useCallback(
    async ({ address, text }: TonTransferParams) => {
      const item = { address: address };
      const toAccount = await getAccountAsync(item);

      const done = !toAccount.memoRequired
        ? true
        : toAccount.memoRequired && text
        ? true
        : false;
      setRecipient({
        address: item,
        toAccount,
        comment: text ?? '',
        done,
      });
    },
    [setRecipient, getAccountAsync]
  );

  const processJetton = useCallback(
    async ({ amount, jetton }: TonTransferParams) => {
      if (!amount && !jetton) return;

      const balance = filter.balances.find((item) =>
        seeIfAddressEqual(item.jettonAddress, jetton)
      );
      const decimals = balance?.metadata?.decimals ?? DefaultDecimals;

      const amountValue = amount
        ? String(formatDecimals(amount, decimals))
        : '0';

      setAmount({
        amount: amountValue,
        jetton: balance?.jettonAddress ?? asset,
        max: false,
        done: false,
        fee: undefined!,
      });
    },
    [setAmount, filter, asset]
  );

  const onScan = async (signature: string) => {
    const param = parseTonTransfer({ url: signature });
    if (param === null) {
      return sdk.uiEvents.emit('copy', {
        method: 'copy',
        params: t('Unexpected_QR_Code'),
      });
    } else {
      await processJetton(param);
      await processRecipient(param);
    }
  };

  const [state, nodeRef] = (() => {
    if (!recipient || !recipient.done) {
      return ['recipient', recipientRef] as const;
    }
    if (!amount || !amount.done) {
      return ['amount', amountRef] as const;
    }
    return ['confirm', confirmRef] as const;
  })();

  return (
    <Wrapper standalone={standalone}>
      <TransitionGroup childFactory={childFactoryCreator(right)}>
        <CSSTransition
          key={state}
          nodeRef={nodeRef}
          classNames="right-to-left"
          addEndListener={(done) => {
            setTimeout(done, duration);
          }}
        >
          <div ref={nodeRef}>
            {state === 'recipient' && (
              <RecipientView
                title={t('transaction_recipient')}
                data={recipient}
                onClose={onClose}
                setRecipient={onRecipient}
                allowComment={asset === CryptoCurrency.TON}
                onScan={onScan}
                keyboard="decimal"
                isExternalLoading={isAccountLoading}
              />
            )}
            {state === 'amount' && (
              <AmountView
                data={amount}
                onClose={onClose}
                onBack={backToRecipient}
                asset={asset}
                jettons={filter}
                info={info}
                recipient={recipient!}
                setAmount={onAmount}
              />
            )}
            {state === 'confirm' && (
              <ConfirmView
                onClose={onClose}
                onBack={backToAmount}
                recipient={recipient!}
                amount={amount!}
                jettons={filter}
              />
            )}
          </div>
        </CSSTransition>
      </TransitionGroup>
    </Wrapper>
  );
};

export const SendAction: FC<{ asset?: string }> = ({ asset }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const Content = useCallback(() => {
    if (!open) return undefined;
    return <SendContent onClose={() => setOpen(false)} asset={asset} />;
  }, [open, asset]);

  return (
    <>
      <Action
        icon={<SendIcon />}
        title={t('wallet_send')}
        action={() => setOpen(true)}
      />
      <Notification
        isOpen={open}
        handleClose={() => setOpen(false)}
        hideButton
        backShadow
      >
        {Content}
      </Notification>
    </>
  );
};
