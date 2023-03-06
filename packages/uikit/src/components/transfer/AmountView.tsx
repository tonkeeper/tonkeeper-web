import { FiatCurrencySymbolsConfig } from '@tonkeeper/core/dist/entries/fiat';
import React, { FC, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useWalletJettonList } from '../../state/wallet';
import { BackButton } from '../fields/BackButton';
import { Button } from '../fields/Button';
import { Sentence } from '../fields/Sentence';
import { ChevronLeftIcon } from '../Icon';
import { Gap } from '../Layout';
import {
  FullHeightBlock,
  NotificationCancelButton,
  NotificationTitleBlock,
} from '../Notification';
import { Body2, H3, Label2, Num2 } from '../Text';

export interface AmountData {
  amount: number;
  jetton: string;
  max: boolean;
  done: boolean;
}

const ButtonBlock = styled.div<{ width: number }>`
  position: fixed;
  bottom: 1rem;
  width: ${(props) => props.width}px;
`;

const AmountBlock = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 272px;
  padding: 1rem;
  box-sizing: border-box;
  position: relative;
  width: 100%;
  border-radius: ${(props) => props.theme.cornerSmall};
  background: ${(props) => props.theme.backgroundContent};
`;

const MaxRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const MaxButton = styled(Label2)`
  cursor: pointer;
  padding: 8px 16px;
  border-radius: ${(props) => props.theme.cornerSmall};
  background: ${(props) => props.theme.backgroundContent};

  &:hover {
    background: ${(props) => props.theme.backgroundContentTint};
  }
`;

const Remaining = styled(Body2)`
  color: ${(props) => props.theme.textSecondary};
`;

const Symbol = styled(Num2)`
  color: ${(props) => props.theme.textSecondary};
  padding-left: 1rem;

  @media (max-width: 600px) {
    padding-left: 0.5rem;
    font-size: 22px;
  }
`;

function isNumeric(str: string) {
  str = str.replaceAll(',', '');
  return !isNaN(Number(str)) && !isNaN(parseFloat(str));
}

export const AmountView: FC<{
  onClose: () => void;
  onBack: () => void;
  setAmount: (data: AmountData) => void;
  address: string;
  asset: string;
  data?: AmountData;
  width: number;
}> = ({ address, onClose, onBack, setAmount, asset, data, width }) => {
  const { fiat } = useAppContext();
  const { data: jettons } = useWalletJettonList();

  const { t } = useTranslation();
  const [amount, setAmountValue] = useState(data ? String(data.amount) : '');
  const [max, setMax] = useState(data?.max ?? false);
  const [jetton, setJetton] = useState(data?.jetton ?? asset);

  const suffix = jetton === 'TON' ? 'TON' : 'JETTON';

  const onInput = (value: string) => {
    if (value.length > 22) return;
    try {
      const [entry, ...tail] = value.replaceAll(',', '').split('.');
      if (entry.length > 11) return;

      const start = parseInt(entry, 10);

      if (isNaN(start)) {
        throw new Error('Not a number');
      }
      const config = FiatCurrencySymbolsConfig[fiat];
      const balanceFormat = new Intl.NumberFormat(config.numberFormat);

      setAmountValue([balanceFormat.format(start), ...tail].join('.'));
    } catch (e) {
      setAmountValue(value);
    }
  };

  const isValid = useMemo(() => {
    return isNumeric(amount);
  }, [amount]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
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

      <AmountBlock>
        <Sentence value={amount} setValue={onInput} />
        <Symbol>{suffix}</Symbol>
      </AmountBlock>
      <MaxRow>
        <MaxButton onClick={() => setMax(true)}>{t('Max')}</MaxButton>
        <Remaining>{t('Remaining').replace('%1%', '100 TON')}</Remaining>
      </MaxRow>

      <Gap />
      <ButtonBlock width={width}>
        <Button
          fullWidth
          size="large"
          primary
          type="submit"
          disabled={!isValid}
        >
          {t('continue')}
        </Button>
      </ButtonBlock>
    </FullHeightBlock>
  );
};
