import React, { FC, useState } from 'react';
import { useTranslation } from '../../hooks/translation';
import { BackButton } from '../fields/BackButton';
import { Button } from '../fields/Button';
import { Input } from '../fields/Input';
import { ChevronLeftIcon } from '../Icon';
import { Gap } from '../Layout';
import {
  FullHeightBlock,
  NotificationCancelButton,
  NotificationTitleBlock,
} from '../Notification';
import { H3 } from '../Text';

export interface AmountData {
  amount: number;
  jetton: string;
  max: boolean;
  done: boolean;
}

export const AmountView: FC<{
  onClose: () => void;
  onBack: () => void;
  setAmount: (data: AmountData) => void;
  address: string;
  asset: string;
  data?: AmountData;
}> = ({ address, onClose, onBack, setAmount, asset, data }) => {
  const { t } = useTranslation();
  const [amount, setAmountValue] = useState(data ? String(data.amount) : '');
  const [max, setMax] = useState(data?.max ?? false);
  const [jetton, setJetton] = useState(data?.jetton ?? asset);

  const isValid = amount != '';

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.stopPropagation();

    setAmount({ amount: parseInt(amount), max, done: true, jetton });
  };

  return (
    <FullHeightBlock onSubmit={onSubmit}>
      <NotificationTitleBlock>
        <BackButton onClick={onBack}>
          <ChevronLeftIcon />
        </BackButton>
        <H3>{t('txActions_amount')}</H3>
        <NotificationCancelButton handleClose={onClose} />
      </NotificationTitleBlock>

      <Input value={amount} onChange={setAmountValue} />

      <Gap />

      <Button fullWidth size="large" primary type="submit" disabled={!isValid}>
        {t('continue')}
      </Button>
    </FullHeightBlock>
  );
};
