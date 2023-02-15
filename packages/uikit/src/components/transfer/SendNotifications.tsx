import React, { FC, useCallback, useState } from 'react';
import { useTranslation } from '../../hooks/translation';
import { Action } from '../home/Actions';
import { SendIcon } from '../home/HomeIcons';
import { Notification } from '../Notification';
import { AmountData, AmountView } from './AmountView';
import { ConfirmView } from './ConfirmView';
import { RecipientData, RecipientView } from './RecipientView';

const SendContent: FC<{ onClose: () => void; asset?: string }> = ({
  onClose,
  asset = 'TON',
}) => {
  const [recipient, setRecipient] = useState<RecipientData | undefined>(
    undefined
  );
  const [amount, setAmount] = useState<AmountData | undefined>(undefined);

  const backToRecipient = useCallback(() => {
    setRecipient((value) => (value ? { ...value, done: false } : undefined));
  }, [setRecipient]);

  const backToAmount = useCallback(() => {
    setAmount((value) => (value ? { ...value, done: false } : undefined));
  }, [setAmount]);

  if (!recipient || !recipient.done) {
    return (
      <RecipientView
        data={recipient}
        onClose={onClose}
        setRecipient={setRecipient}
      />
    );
  }

  if (!amount || !amount.done) {
    return (
      <AmountView
        data={amount}
        onClose={onClose}
        onBack={backToRecipient}
        asset={asset}
        address={recipient.address}
        setAmount={setAmount}
      />
    );
  }

  return (
    <ConfirmView
      onClose={onClose}
      onBack={backToAmount}
      recipient={recipient}
      amount={amount}
    />
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
      <Notification isOpen={open} handleClose={() => setOpen(false)} hideButton>
        {Content}
      </Notification>
    </>
  );
};
