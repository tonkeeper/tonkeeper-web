import { AccountRepr, JettonsBalances } from '@tonkeeper/core/dist/tonApi';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import {
  getJettonSymbol,
  getMaxValue,
  getRemaining,
  isNumeric,
  parseAndValidateInput,
} from '@tonkeeper/core/dist/utils/send';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
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
import { AssetSelect } from './AssetSelect';
import { duration } from './common';

export interface AmountData {
  amount: number;
  jetton: string;
  max: boolean;
  done: boolean;
}

const Center = styled.div`
  text-align: center;
  margin-bottom: -8px;
`;

const SubTitle = styled(Body2)`
  color: ${(props) => props.theme.textSecondary};
`;

const Title = styled(H3)`
  margin: -3px 0 0;
`;
const ButtonBlock = styled.div<{ width: number }>`
  position: fixed;
  bottom: 1rem;
  width: ${(props) => props.width}px;
`;

const AmountBlock = styled.label`
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

const MaxButton = styled(Label2)<{ maxValue: boolean }>`
  cursor: pointer;
  padding: 8px 16px;
  border-radius: ${(props) => props.theme.cornerSmall};
  background: ${(props) =>
    props.maxValue
      ? props.theme.buttonPrimaryBackground
      : props.theme.backgroundContent};

  &:hover {
    background: ${(props) =>
      props.maxValue
        ? props.theme.buttonPrimaryBackgroundHighlighted
        : props.theme.backgroundContentTint};
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
    const fixed = parseAndValidateInput(value, jettons, jetton, format);
    if (fixed !== undefined) {
      setMax(false);
      setAmountValue(fixed);
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

  const onMax = () => {
    setMax(true);
    setAmountValue(getMaxValue(jettons, info, jetton, format));
  };

  const onJetton = (value: string) => {
    setJetton(value);
    if (max) {
      setAmountValue(getMaxValue(jettons, info, value, format));
    }
  };

  return (
    <FullHeightBlock onSubmit={onSubmit}>
      <NotificationTitleBlock>
        <BackButton onClick={onBack}>
          <ChevronLeftIcon />
        </BackButton>
        <Center>
          <Title>{t('txActions_amount')}</Title>
          <SubTitle>
            {t('send_screen_steps_done_to').replace(
              '%{name}',
              toShortAddress(address)
            )}
          </SubTitle>
        </Center>
        <NotificationCancelButton handleClose={onClose} />
      </NotificationTitleBlock>

      <AmountBlock>
        <SelectCenter>
          <AssetSelect
            info={info}
            jetton={jetton}
            setJetton={onJetton}
            jettons={jettons}
          />
        </SelectCenter>
        <Sentence ref={ref} value={amount} setValue={onInput} />
        <Symbol>{suffix}</Symbol>
      </AmountBlock>
      <MaxRow>
        <MaxButton maxValue={max} onClick={onMax}>
          {t('Max')}
        </MaxButton>
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
