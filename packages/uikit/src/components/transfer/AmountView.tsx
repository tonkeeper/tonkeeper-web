import { FiatCurrencySymbolsConfig } from '@tonkeeper/core/dist/entries/fiat';
import { AccountRepr, JettonsBalances } from '@tonkeeper/core/dist/tonApi';
import BigNumber from 'bignumber.js';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
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
import { AssetSelect, getJettonDecimals, getJettonSymbol } from './AssetSelect';
import { duration, TONAsset } from './common';

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

const RemainingInvalid = styled(Body2)`
  color: ${(props) => props.theme.accentRed};
`;

const Symbol = styled(Num2)`
  color: ${(props) => props.theme.textSecondary};
  padding-left: 1rem;

  @media (max-width: 600px) {
    padding-left: 0.5rem;
    font-size: 22px;
  }
`;

const SelectCenter = styled.div`
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
`;

function toNumberAmount(str: string): number {
  str = str.replaceAll(',', '');
  return parseFloat(str);
}
function isNumeric(str: string) {
  str = str.replaceAll(',', '');
  return !isNaN(Number(str)) && !isNaN(parseFloat(str));
}

const getRemaining = (
  jettons: JettonsBalances,
  info: AccountRepr | undefined,
  jetton: string,
  amount: string,
  max: boolean,
  format: (amount: number | string, decimals?: number) => string
): [string, boolean] => {
  if (jetton === TONAsset) {
    if (max) {
      return [`0 ${TONAsset}`, true];
    }

    const remaining = new BigNumber(info?.balance ?? 0).minus(
      isNumeric(amount)
        ? new BigNumber(toNumberAmount(amount)).multipliedBy(Math.pow(10, 9))
        : 0
    );

    return [
      `${format(remaining.toString())} ${TONAsset}`,
      remaining.isGreaterThan(0),
    ];
  }

  const jettonInfo = jettons.balances.find(
    (item) => item.jettonAddress === jetton
  );
  if (!jettonInfo) {
    return ['0', false];
  }

  if (max) {
    return [`0 ${jettonInfo.metadata?.symbol}`, true];
  }

  const remaining = new BigNumber(jettonInfo.balance).minus(
    isNumeric(amount)
      ? new BigNumber(toNumberAmount(amount)).multipliedBy(
          Math.pow(10, jettonInfo.metadata?.decimals ?? 9)
        )
      : 0
  );

  return [
    `${format(remaining.toString(), jettonInfo.metadata?.decimals)} ${
      jettonInfo.metadata?.symbol
    }`,
    remaining.isGreaterThan(0),
  ];
};

export const AmountView: FC<{
  onClose: () => void;
  onBack: () => void;
  setAmount: (data: AmountData) => void;
  address: string;
  asset: string;
  jettons: JettonsBalances;
  info?: AccountRepr;
  data?: AmountData;
  width: number;
}> = ({
  address,
  onClose,
  onBack,
  setAmount,
  asset,
  data,
  width,
  jettons,
  info,
}) => {
  const format = useFormatCoinValue();

  const [amount, setAmountValue] = useState(data ? String(data.amount) : '');
  const [jetton, setJetton] = useState(data?.jetton ?? asset);

  const { fiat } = useAppContext();

  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      setTimeout(() => {
        ref.current && ref.current.focus();
      }, duration);
    }
  }, [ref.current, jetton]);

  const { t } = useTranslation();

  const [max, setMax] = useState(data?.max ?? false);

  const suffix = getJettonSymbol(jetton, jettons);

  const onInput = (value: string) => {
    if (value.length > 22) return;
    try {
      const [entry, ...tail] = value.replaceAll(',', '').split('.');
      if (entry.length > 11) return;
      if (tail.length > 1) return;
      const decimals = getJettonDecimals(jetton, jettons);
      if (tail && tail[0].length > decimals) return;

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

  const [remaining, valid] = useMemo(
    () => getRemaining(jettons, info, jetton, amount, max, format),
    [jettons, info, jetton, amount, max]
  );

  const isValid = useMemo(() => {
    return valid && isNumeric(amount);
  }, [valid, amount]);

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
        <SelectCenter>
          <AssetSelect
            jetton={jetton}
            setJetton={setJetton}
            jettons={jettons}
          />
        </SelectCenter>
        <Sentence ref={ref} value={amount} setValue={onInput} />
        <Symbol>{suffix}</Symbol>
      </AmountBlock>
      <MaxRow>
        <MaxButton onClick={() => setMax(true)}>{t('Max')}</MaxButton>
        {valid ? (
          <Remaining>{t('Remaining').replace('%1%', remaining)}</Remaining>
        ) : (
          <RemainingInvalid>
            {t('send_screen_steps_amount_insufficient_balance')}
          </RemainingInvalid>
        )}
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
