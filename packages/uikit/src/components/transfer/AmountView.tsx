import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  getDecimalSeparator,
  getNotDecimalSeparator,
} from '@tonkeeper/core/dist/utils/formatting';
import {
  formatSendValue,
  getJettonDecimals,
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
import {
  AmountState,
  getCoinAmount,
  initAmountState,
  setAmountStateJetton,
  setAmountStateMax,
  setAmountStateValue,
  toggleAmountState,
} from './amountState';
import { AssetSelect } from './AssetSelect';
import { ButtonBlock, notifyError } from './common';
import { InputSize, Sentence } from './Sentence';

const Center = styled.div`
  text-align: center;
  margin-bottom: -8px;
`;

const SubTitle = styled(Body2)`
  color: ${(props) => props.theme.textSecondary};
`;

const Title = styled(H3)`
  margin: -6px 0 0;
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

const Name = styled.span`
  color: ${(props) => props.theme.textPrimary};
  margin-left: 4px;
`;
const Address = styled.span`
  margin-left: 4px;
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
  const client = useQueryClient();

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
      await notifyError(client, sdk, t, e);
      throw e;
    }
  });
};

const replaceTypedDecimalSeparator = (value: string): string => {
  if (value.endsWith(getNotDecimalSeparator())) {
    const updated = value.slice(0, -1) + getDecimalSeparator();
    if (isNumeric(removeGroupSeparator(updated))) return updated;
  }
  return value;
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
  setAmount: (data: AmountData | undefined) => void;
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
  const [jetton, setJetton] = useState(data?.jetton ?? asset);
  const [inputAmount, setAmountValue] = useState<AmountState>(
    initAmountState({ data, fiat, stock, jetton, jettons })
  );

  const ref = useRef<HTMLInputElement>(null);
  const refBlock = useRef<HTMLLabelElement>(null);
  const refButton = useRef<HTMLDivElement>(null);

  const setAmountState = (newState: AmountState) => {
    if (refBlock.current) {
      const size = getInputSize(newState.primaryValue, refBlock.current);
      setFontSize(size);
    }
    setAmountValue(newState);
  };

  const toggleFiat = () => {
    setAmountState(toggleAmountState(inputAmount));
  };

  const { mutateAsync, isLoading, reset } = useEstimateTransaction(
    recipient,
    jetton,
    jettons
  );

  useButtonPosition(refButton, refBlock);

  useEffect(() => {
    if (refBlock.current) {
      setFontSize(getInputSize(inputAmount.primaryValue, refBlock.current));
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

  const onInput = (value: string) => {
    const decimals = inputAmount.inFiat
      ? 2
      : getJettonDecimals(jetton, jettons);

    value = replaceTypedDecimalSeparator(value);

    if (!seeIfValueValid(value, decimals)) {
      value = inputAmount.primaryValue;
    }

    if (isNumeric(value)) {
      value = formatSendValue(value);
    }

    const newState = setAmountStateValue({
      value,
      state: inputAmount,
      fiat,
      stock,
      jetton,
      jettons,
    });

    setAmountState(newState);
    setMax(false);
  };

  const [remaining, valid] = useMemo(
    () =>
      getRemaining(
        jettons,
        info,
        jetton,
        getCoinAmount(inputAmount),
        max,
        format
      ),
    [jettons, info, jetton, inputAmount, max, format]
  );

  const isValid = useMemo(() => {
    return (
      valid &&
      isNumeric(inputAmount.primaryValue) &&
      inputToBigNumber(inputAmount.primaryValue).isGreaterThan(0)
    );
  }, [valid, inputAmount]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    async (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (isValid) {
        reset();
        const coinValue = inputToBigNumber(getCoinAmount(inputAmount));
        const fiatValue = inputAmount.inFiat
          ? inputToBigNumber(inputAmount.primaryValue)
          : undefined;

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
    [setAmount, inputAmount, max, jetton, isValid]
  );

  const onMax = () => {
    if (!refBlock.current) return;

    const value = max ? '0' : getMaxValue(jettons, info, jetton, format);
    const newState = setAmountStateMax({
      value,
      state: inputAmount,
      fiat,
      stock,
      jetton,
      jettons,
    });
    setAmountState(newState);
    setMax((state) => !state);
  };

  const onJetton = (asset: string) => {
    setJetton(asset);
    setAmountState(
      setAmountStateJetton({
        state: inputAmount,
        newMaxValue: max
          ? getMaxValue(jettons, info, asset, format)
          : undefined,
        stock,
        jetton: asset,
        jettons,
        fiat,
      })
    );
  };

  const address = toShortAddress(recipient.toAccount.address.bounceable);

  return (
    <FullHeightBlock onSubmit={onSubmit} standalone={standalone}>
      <NotificationTitleBlock>
        <BackButton onClick={onBack}>
          <ChevronLeftIcon />
        </BackButton>
        <Center>
          <Title>{t('txActions_amount')}</Title>
          <SubTitle>
            {t('send_screen_steps_done_to').replace('%{name}', '')}
            {recipient.toAccount.name && (
              <Name>{recipient.toAccount.name}</Name>
            )}
            <Address>{address}</Address>
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
            value={inputAmount.primaryValue}
            setValue={onInput}
            inputSize={fontSize}
          />
          <Symbol>{inputAmount.primarySymbol}</Symbol>
        </InputBlock>

        {inputAmount.secondaryValue && (
          <FiatBlock onClick={toggleFiat}>
            {inputAmount.secondaryValue} {inputAmount.secondarySymbol}
          </FiatBlock>
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
