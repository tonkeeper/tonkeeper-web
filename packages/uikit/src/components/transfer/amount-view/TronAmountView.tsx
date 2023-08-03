import { CryptoCurrency, TRON_USDT_INFO } from '@tonkeeper/core/dist/entries/crypto';
import { AmountData, TronRecipientData } from '@tonkeeper/core/dist/entries/send';
import { Fee } from '@tonkeeper/core/dist/tonApiV1';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';
import { formatNumberValue, formatSendValue, isNumeric } from '@tonkeeper/core/dist/utils/send';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../../hooks/appContext';
import { useFormatCoinValue } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import { useWalletAccountInfo } from '../../../state/wallet';
import { ChevronLeftIcon } from '../../Icon';
import { Gap } from '../../Layout';
import {
    FullHeightBlock,
    NotificationCancelButton,
    NotificationTitleBlock
} from '../../Notification';
import { BackButton } from '../../fields/BackButton';
import { Button } from '../../fields/Button';
import { InputSize, Sentence } from '../Sentence';
import { defaultSize, getInputSize, useButtonPosition } from '../amountHooks';
import { ButtonBlock } from '../common';
import {
    Address,
    AmountBlock,
    Center,
    FiatBlock,
    InputBlock,
    MaxButton,
    MaxRow,
    Remaining,
    RemainingInvalid,
    SelectCenter,
    SubTitle,
    Symbol,
    Title,
    inputToBigNumber,
    replaceTypedDecimalSeparator,
    seeIfValueValid
} from './AmountViewUI';
import { AmountState, getCoinAmount, toggleAmountState } from './amountState';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Label1 } from '../../Text';

const TRC20Badge = styled.div`
    padding: 0.5rem 0.75rem;
    border-radius: ${props => props.theme.cornerExtraSmall};
    background-color: ${props => props.theme.buttonTertiaryBackground};
`;

export const TronAmountView: FC<{
    onClose: () => void;
    onBack: (data: AmountData | undefined) => void;
    setAmount: (data: AmountData | undefined) => void;
    recipient: TronRecipientData;
    data?: Partial<AmountData>;
}> = ({ recipient, onClose, onBack, setAmount, data }) => {
    const jetton = CryptoCurrency.TRON_USDT; // TODO const / address
    const { data: info } = useWalletAccountInfo();

    const { fiat, standalone } = useAppContext();
    //const { data: stock } = useTonenpointStock();
    const format = useFormatCoinValue();

    const [fontSize, setFontSize] = useState<InputSize>(defaultSize);

    const [inputAmount, setAmountValue] = useState<AmountState>({
        primaryValue: data?.amount ? formatNumberValue(data.amount) : '0',
        primarySymbol: TRON_USDT_INFO.symbol,
        inFiat: false,
        secondaryValue: '0', // TODO USDT price
        secondarySymbol: fiat
    });

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

    const { mutateAsync, isLoading, reset } = {
        mutateAsync: (..._: any[]): Promise<Fee> => {
            return Promise.resolve({} as unknown as Fee);
        },
        isLoading: false,
        reset: () => {}
    }; // TODO

    useButtonPosition(refButton, refBlock);

    useEffect(() => {
        if (refBlock.current) {
            setFontSize(getInputSize(inputAmount.primaryValue, refBlock.current));
        }
    }, [refBlock.current]);

    const [max, setMax] = useState(data?.max ?? false);

    const { t } = useTranslation();

    const onInput = (value: string) => {
        const decimals = inputAmount.inFiat ? 2 : TRON_USDT_INFO.decimals;

        value = replaceTypedDecimalSeparator(value);

        if (!seeIfValueValid(value, decimals)) {
            value = inputAmount.primaryValue;
        }

        if (isNumeric(value)) {
            value = formatSendValue(value);
        }

        /*
        const newState = setAmountStateValue({
            value,
            state: inputAmount,
            fiat,
            stock,
            jetton,
            jettons
        });
        */

        const newState = {
            primaryValue: value,
            primarySymbol: TRON_USDT_INFO.symbol,
            inFiat: false,
            secondaryValue: '0', // TODO USDT price
            secondarySymbol: fiat
        };

        setAmountState(newState);
        setMax(false);
    };

    const [remaining, valid] = ['0', false]; // TODO

    /* useMemo(
        () => getRemaining(jettons, info, jetton, getCoinAmount(inputAmount), max, format),
        [jettons, info, jetton, inputAmount, max, format]
    ); */

    const isValid = useMemo(() => {
        return (
            valid &&
            isNumeric(inputAmount.primaryValue) &&
            inputToBigNumber(inputAmount.primaryValue).isGreaterThan(0)
        );
    }, [valid, inputAmount]);

    const handleBack = () => {
        if (isValid) {
            const coinValue = inputToBigNumber(getCoinAmount(inputAmount));
            const fiatValue = inputAmount.inFiat
                ? inputToBigNumber(inputAmount.primaryValue)
                : undefined;

            onBack({
                amount: coinValue,
                fiat: fiatValue,
                max,
                done: false,
                jetton,
                fee: undefined!
            });
        } else {
            onBack(undefined);
        }
    };

    const onSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
        async e => {
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
                    max
                });

                setAmount({
                    amount: coinValue,
                    fiat: fiatValue,
                    max,
                    done: true,
                    jetton,
                    fee
                });
            }
        },
        [setAmount, inputAmount, max, jetton, isValid]
    );

    const onMax = () => {
        // TODO
        setMax(state => !state);
    };

    const address = toShortValue(recipient.address.address);

    return (
        <FullHeightBlock onSubmit={onSubmit} standalone={standalone}>
            <NotificationTitleBlock>
                <BackButton onClick={handleBack}>
                    <ChevronLeftIcon />
                </BackButton>
                <Center>
                    <Title>{t('txActions_amount')}</Title>
                    <SubTitle>
                        {t('send_screen_steps_done_to').replace('%{name}', '')}
                        <Address>{address}</Address>
                    </SubTitle>
                </Center>
                <NotificationCancelButton handleClose={onClose} />
            </NotificationTitleBlock>

            <AmountBlock ref={refBlock}>
                <SelectCenter>
                    <TRC20Badge>
                        <Label1>TRC20</Label1>
                    </TRC20Badge>
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
