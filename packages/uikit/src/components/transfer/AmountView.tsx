import { useMutation } from '@tanstack/react-query';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import {
  AmountData,
  AmountValue,
  RecipientData,
} from '@tonkeeper/core/dist/entries/send';
import { estimateJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { estimateTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { AccountRepr, JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { TonendpointStock } from '@tonkeeper/core/dist/tonkeeperApi/stock';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import {
  getJettonDecimals,
  getJettonSymbol,
  getMaxValue,
  getRemaining,
  isNumeric,
  seeIfLargeTail,
} from '@tonkeeper/core/dist/utils/send';
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useFormatCoinValue } from '../../hooks/balance';
import { getTextWidth } from '../../hooks/textWidth';
import { useTranslation } from '../../hooks/translation';
import { BackButton } from '../fields/BackButton';
import { Button } from '../fields/Button';
import { ChevronLeftIcon } from '../Icon';
import { Gap } from '../Layout';
import {
  FullHeightBlock,
  NotificationCancelButton,
  NotificationTitleBlock,
} from '../Notification';
import { Body1, Body2, H3, Label2, Num2 } from '../Text';
import { AssetSelect } from './AssetSelect';
import { ButtonBlock, duration, useFiatAmount } from './common';
import { InputSize, Sentence } from './Sentence';

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
  }
`;

const SelectCenter = styled.div`
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
`;

const FiatBlock = styled(Body1)`
  position: absolute;
  bottom: 61px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;

  padding: 8px 16px;

  color: ${(props) => props.theme.textSecondary};
  border: 1px solid ${(props) => props.theme.buttonTertiaryBackground};
  border-radius: ${(props) => props.theme.cornerLarge};

  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const useEstimateTransaction = (
  recipient: RecipientData,
  jetton: string,
  jettons: JettonsBalances
) => {
  const { tonApi } = useAppContext();
  const wallet = useWalletContext();

  return useMutation(async (options: AmountValue) => {
    if (jetton === CryptoCurrency.TON) {
      return estimateTonTransfer(tonApi, wallet, recipient, options);
    } else {
      const [jettonInfo] = jettons.balances.filter(
        (item) => item.jettonAddress === jetton
      );
      return estimateJettonTransfer(
        tonApi,
        wallet,
        recipient,
        options,
        jettonInfo
      );
    }
  });
};

const defaultSize: InputSize = { size: 40, width: 20 };

const getInputSize = (value: string, parent: HTMLLabelElement) => {
  if (value.endsWith('.')) {
    value = `${value}0`;
  }
  const max = parent.clientWidth;
  let size = defaultSize.size;
  let width = getTextWidth(value, `600 ${size}px 'Montserrat'`);
  while (Math.round(width) > max - 115) {
    size = Math.max(1, size - 1);
    width = getTextWidth(value, `600 ${size}px 'Montserrat'`);
  }

  return {
    width: Math.max(Math.round(width) + 10, value.length * 6, 20),
    size: size,
  };
};

const seeIfValueValid = (value: string, decimals: number) => {
  if (value.length > 32) return false;
  if (value !== '') {
    if (value.endsWith(',')) return false;
    if (value.endsWith('e')) return false;
    if (/^[a-zA-Z]+$/.test(value)) return false;
    if (!isNumeric(value)) return false;
    if (seeIfLargeTail(value, decimals)) return false;
  }

  return true;
};
export const AmountView: FC<{
  onClose: () => void;
  onBack: () => void;
  setAmount: (data: AmountData) => void;
  recipient: RecipientData;
  asset: string;
  jettons: JettonsBalances;
  info?: AccountRepr;
  data?: AmountData;
  stock?: TonendpointStock;
}> = ({
  recipient,
  onClose,
  onBack,
  setAmount,
  asset,
  data,
  jettons,
  info,
}) => {
  const format = useFormatCoinValue();

  const [jetton, setJetton] = useState(data?.jetton ?? asset);
  const [amount, setAmountValue] = useState(data ? data.amount : '');

  const [fontSize, setFontSize] = useState<InputSize>(defaultSize);

  const { mutateAsync, isLoading, reset } = useEstimateTransaction(
    recipient,
    jetton,
    jettons
  );

  const ref = useRef<HTMLInputElement>(null);
  const refBlock = useRef<HTMLLabelElement>(null);

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
    if (!refBlock.current) return;
    const decimals = getJettonDecimals(jetton, jettons);

    if (!seeIfValueValid(value, decimals)) {
      value = amount;
    }

    setFontSize(getInputSize(value, refBlock.current));
    setMax(false);
    setAmountValue(value);
  };

  const [remaining, valid] = useMemo(
    () => getRemaining(jettons, info, jetton, amount, max, format),
    [jettons, info, jetton, amount, max]
  );

  const isValid = useMemo(() => {
    return valid && isNumeric(amount);
  }, [valid, amount]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    async (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (isValid) {
        reset();
        const fee = await mutateAsync({ amount, max });
        setAmount({ amount, max, done: true, jetton, fee });
      }
    },
    [setAmount, amount, max, jetton, isValid]
  );

  const onMax = () => {
    if (!refBlock.current) return;

    setMax(true);
    const value = getMaxValue(jettons, info, jetton, format);
    const size = getInputSize(value, refBlock.current);
    setFontSize(size);
    setAmountValue(value);
  };

  const onJetton = (asset: string) => {
    if (!refBlock.current) return;

    setJetton(asset);
    if (max) {
      const value = getMaxValue(jettons, info, asset, format);
      const size = getInputSize(value, refBlock.current);
      setFontSize(size);
      setAmountValue(value);
    }
  };

  const fiatAmount = useFiatAmount(jettons, jetton, amount);

  return (
    <FullHeightBlock onSubmit={onSubmit} noValidate>
      <NotificationTitleBlock>
        <BackButton onClick={onBack}>
          <ChevronLeftIcon />
        </BackButton>
        <Center>
          <Title>{t('txActions_amount')}</Title>
          <SubTitle>
            {t('send_screen_steps_done_to').replace(
              '%{name}',
              toShortAddress(recipient.toAccount.address.bounceable)
            )}
          </SubTitle>
        </Center>
        <NotificationCancelButton handleClose={onClose} />
      </NotificationTitleBlock>

      <AmountBlock ref={refBlock}>
        <SelectCenter>
          <AssetSelect
            info={info}
            jetton={jetton}
            setJetton={onJetton}
            jettons={jettons}
          />
        </SelectCenter>
        <Sentence
          ref={ref}
          value={amount}
          setValue={onInput}
          inputSize={fontSize}
        />
        <Symbol>{suffix}</Symbol>
        {fiatAmount && <FiatBlock>{fiatAmount}</FiatBlock>}
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
      <ButtonBlock>
        <Button
          fullWidth
          size="large"
          primary
          type="submit"
          disabled={!isValid}
          loading={isLoading}
        >
          {t('continue')}
        </Button>
      </ButtonBlock>
    </FullHeightBlock>
  );
};
