import { useMutation } from '@tanstack/react-query';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import {
  AmountData,
  AmountValue,
  RecipientData
} from '@tonkeeper/core/dist/entries/send';
import { estimateTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { AccountRepr, JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { TonendpointStock } from '@tonkeeper/core/dist/tonkeeperApi/stock';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import {
  getJettonSymbol,
  getMaxValue,
  getRemaining,
  isNumeric,
  parseAndValidateInput
} from '@tonkeeper/core/dist/utils/send';
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import styled from 'styled-components';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { BackButton } from '../fields/BackButton';
import { Button } from '../fields/Button';
import { ChevronLeftIcon } from '../Icon';
import { Gap } from '../Layout';
import {
  FullHeightBlock,
  NotificationCancelButton,
  NotificationTitleBlock
} from '../Notification';
import { Body1, Body2, H3, Label2, Num2 } from '../Text';
import { AssetSelect } from './AssetSelect';
import { ButtonBlock, duration, useFiatAmount } from './common';
import { Sentence } from './Sentence';

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
    font-size: 22px;
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
      throw new Error('Undone');
    }
  });
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
  width: number;
  stock?: TonendpointStock;
}> = ({
  recipient,
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

  const [jetton, setJetton] = useState(data?.jetton ?? asset);
  const [amount, setAmountValue] = useState(data ? data.amount : '');

  const { mutateAsync, isLoading, reset } = useEstimateTransaction(
    recipient,
    jetton,
    jettons
  );

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

  const onSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    async (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (isValid) {
        reset();
        const fee = await mutateAsync({ amount, max });
        console.log(fee);
        setAmount({ amount, max, done: true, jetton, fee });
      }
    },
    [setAmount, amount, max, jetton, isValid]
  );

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

  const fiatAmount = useFiatAmount(jettons, jetton, amount);

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
              toShortAddress(recipient.address.address)
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
      <ButtonBlock width={width}>
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
