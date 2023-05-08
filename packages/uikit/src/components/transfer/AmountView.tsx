import { useMutation } from '@tanstack/react-query';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import {
  AmountData,
  AmountValue,
  RecipientData,
} from '@tonkeeper/core/dist/entries/send';
import { seeIfBalanceError } from '@tonkeeper/core/dist/service/transfer/common';
import { estimateJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { estimateTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { AccountRepr, JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { TonendpointStock } from '@tonkeeper/core/dist/tonkeeperApi/stock';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import { getDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';
import {
  formatNumberValue,
  formatSendValue,
  getCoinAmountValue,
  getFiatAmountValue,
  getJettonDecimals,
  getJettonSymbol,
  getMaxValue,
  getRemaining,
  isNumeric,
  removeGroupSeparator,
  seeIfLargeTail,
} from '@tonkeeper/core/dist/utils/send';
import BigNumber from 'bignumber.js';
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
import { useAppSdk } from '../../hooks/appSdk';
import { useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { useTonenpointStock } from '../../state/tonendpoint';
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
import { defaultSize, getInputSize, useButtonPosition } from './amountHooks';
import { AssetSelect } from './AssetSelect';
import { ButtonBlock, useSecondAmountWithSymbol } from './common';
import { InputSize, Sentence } from './Sentence';

const Center = styled.div`
  text-align: center;
  margin-bottom: -8px;
`;

const SubTitle = styled(Body2)`
  color: ${(props) => props.theme.textSecondary};
`;

const Title = styled(H3)`
  margin: -8px 0 0;
`;

const AmountBlock = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 256px;
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

  user-select: none;
`;

const MaxButton = styled(Label2)<{ maxValue: boolean }>`
  cursor: pointer;
  padding: 8px 16px;
  border-radius: ${(props) => props.theme.cornerMedium};
  background-color: ${(props) =>
    props.maxValue
      ? props.theme.buttonPrimaryBackground
      : props.theme.backgroundContent};
  transition: background-color 0.1s ease;

  &:hover {
    background-color: ${(props) =>
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
  padding-left: 12px;
  white-space: pre;
  padding-bottom: 3px;

  @media (max-width: 600px) {
    padding-left: 8px;
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
  cursor: pointer;
  position: absolute;
  top: 50$;
  left: 50%;
  transform: translate(-50%, 54px);
  z-index: 2;

  padding: 8px 16px;

  color: ${(props) => props.theme.textSecondary};
  border: 1px solid ${(props) => props.theme.buttonTertiaryBackground};
  border-radius: ${(props) => props.theme.cornerLarge};

  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre;

  user-select: none;
`;

const InputBlock = styled.div`
  display: flex;
  align-items: flex-end;
`;

const useEstimateTransaction = (
  recipient: RecipientData,
  jetton: string,
  jettons: JettonsBalances
) => {
  const { t } = useTranslation();
  const sdk = useAppSdk();
  const { tonApi } = useAppContext();
  const wallet = useWalletContext();

  return useMutation(async (options: AmountValue) => {
    try {
      if (jetton === CryptoCurrency.TON) {
        return await estimateTonTransfer(tonApi, wallet, recipient, options);
      } else {
        const [jettonInfo] = jettons.balances.filter(
          (item) => item.jettonAddress === jetton
        );
        return await estimateJettonTransfer(
          tonApi,
          wallet,
          recipient,
          options,
          jettonInfo
        );
      }
    } catch (e) {
      if (seeIfBalanceError(e)) {
        sdk.uiEvents.emit('copy', {
          method: 'copy',
          params: t('send_screen_steps_amount_insufficient_balance'),
        });
      }

      throw e;
    }
  });
};

const seeIfValueValid = (value: string, decimals: number) => {
  if (value.length > 21) return false;
  if (value !== '') {
    if (value.endsWith('e')) return false;
    const separators = value.match(getDecimalSeparator());
    if (separators && separators.length > 1) return false;
    if (/^[a-zA-Z]+$/.test(value)) return false;
    if (!isNumeric(removeGroupSeparator(value))) return false;
    if (seeIfLargeTail(value, decimals)) return false;
  }

  return true;
};

const inputToBigNumber = (value: string): BigNumber => {
  return new BigNumber(removeGroupSeparator(value).replace(',', '.'));
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
  const { fiat, standalone } = useAppContext();
  const { data: stock } = useTonenpointStock();
  const format = useFormatCoinValue();

  const [fontSize, setFontSize] = useState<InputSize>(defaultSize);
  const [inFiat, setInFiat] = useState(data ? data.fiat !== undefined : false);
  const [jetton, setJetton] = useState(data?.jetton ?? asset);
  const [inputAmount, setAmountValue] = useState(
    data ? formatNumberValue(data.fiat ?? data.amount) : '0'
  );

  const ref = useRef<HTMLInputElement>(null);
  const refBlock = useRef<HTMLLabelElement>(null);
  const refButton = useRef<HTMLDivElement>(null);

  const secondAmount = useSecondAmountWithSymbol(
    jettons,
    jetton,
    inputAmount,
    inFiat
  );

  const coinAmount = useMemo(() => {
    if (inFiat) {
      const value = getCoinAmountValue(
        stock,
        jettons,
        fiat,
        jetton,
        inputAmount
      );

      const formatted = new BigNumber(
        value ? value.toFormat(2, BigNumber.ROUND_HALF_UP) : new BigNumber('0')
      );
      return formatNumberValue(formatted);
    } else {
      return inputAmount;
    }
  }, [inFiat, inputAmount, jetton, jettons]);

  const toggleFiat = () => {
    if (!refBlock.current) return;
    if (inFiat) {
      // inputAmount convert to coin
      setAmountValue(coinAmount);
      const size = getInputSize(coinAmount, refBlock.current);
      setFontSize(size);
      setInFiat(!inFiat);
    } else {
      // inputAmount convert to usd
      const fiatAmount = getFiatAmountValue(
        stock,
        jettons,
        fiat,
        jetton,
        inputAmount.toString()
      );

      if (!fiatAmount) return;
      const value = formatNumberValue(new BigNumber(fiatAmount.toFormat(2)));
      setAmountValue(value);
      const size = getInputSize(value, refBlock.current);
      setFontSize(size);
      setInFiat(!inFiat);
    }
  };

  const { mutateAsync, isLoading, reset } = useEstimateTransaction(
    recipient,
    jetton,
    jettons
  );

  useButtonPosition(refButton, refBlock);

  useEffect(() => {
    if (refBlock.current) {
      setFontSize(getInputSize(inputAmount, refBlock.current));
    }
  }, [refBlock.current]);

  const [max, setMax] = useState(data?.max ?? false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
      }
    }, 300);
    return () => {
      clearTimeout(timeout);
    };
  }, [ref.current, jetton]);

  const { t } = useTranslation();

  const suffix = inFiat ? fiat.toString() : getJettonSymbol(jetton, jettons);

  const onInput = (value: string) => {
    if (!refBlock.current) return;
    const decimals = inFiat ? 2 : getJettonDecimals(jetton, jettons);

    if (!seeIfValueValid(value, decimals)) {
      value = inputAmount;
    }

    if (isNumeric(value)) {
      value = formatSendValue(value);
    }

    setFontSize(getInputSize(value, refBlock.current));
    setMax(false);
    setAmountValue(value);
  };

  const [remaining, valid] = useMemo(
    () => getRemaining(jettons, info, jetton, coinAmount, max, format),
    [jettons, info, jetton, coinAmount, max, format]
  );

  const isValid = useMemo(() => {
    return (
      valid &&
      isNumeric(inputAmount) &&
      inputToBigNumber(inputAmount).isGreaterThan(0)
    );
  }, [valid, inputAmount]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    async (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (isValid) {
        reset();
        const coinValue = inputToBigNumber(coinAmount);
        const fiatValue = inFiat ? inputToBigNumber(inputAmount) : undefined;

        const fee = await mutateAsync({
          amount: coinValue,
          fiat: fiatValue,
          max,
        });

        setAmount({
          amount: coinValue,
          fiat: fiatValue,
          max,
          done: true,
          jetton,
          fee,
        });
      }
    },
    [setAmount, inputAmount, coinAmount, inFiat, max, jetton, isValid]
  );

  const onMax = () => {
    if (!refBlock.current) return;

    const value = max ? '0' : getMaxValue(jettons, info, jetton, format);
    const size = getInputSize(value, refBlock.current);
    setFontSize(size);
    setAmountValue(value);
    setMax((state) => !state);
    setInFiat(false);
  };

  const onJetton = (asset: string) => {
    if (!refBlock.current) return;

    setJetton(asset);

    if (max) {
      const value = getMaxValue(jettons, info, asset, format);
      const size = getInputSize(value, refBlock.current);
      setFontSize(size);
      setAmountValue(value);
    } else {
      const value = getCoinAmountValue(
        stock,
        jettons,
        fiat,
        asset,
        inputAmount
      );
      if (!value) {
        setInFiat(false);
      }
    }
  };

  return (
    <FullHeightBlock onSubmit={onSubmit} standalone={standalone}>
      <NotificationTitleBlock>
        <BackButton onClick={onBack}>
          <ChevronLeftIcon />
        </BackButton>
        <Center>
          <Title>{t('txActions_amount')}</Title>
          <SubTitle>
            {t('send_screen_steps_done_to').replace(
              '%{name}',
              recipient.toAccount.name ??
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
        <InputBlock>
          <Sentence
            ref={ref}
            value={inputAmount}
            setValue={onInput}
            inputSize={fontSize}
          />
          <Symbol>{suffix}</Symbol>
        </InputBlock>

        {secondAmount && (
          <FiatBlock onClick={toggleFiat}>{secondAmount}</FiatBlock>
        )}
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
      <ButtonBlock ref={refButton}>
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
