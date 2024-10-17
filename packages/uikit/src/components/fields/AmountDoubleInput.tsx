import React, { forwardRef, ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { replaceTypedDecimalSeparator, seeIfValueValid } from '../transfer/amountView/AmountViewUI';
import { getTextWidth } from '../../hooks/textWidth';
import { formatSendValue, isNumeric, removeGroupSeparator } from '@tonkeeper/core/dist/utils/send';
import { getDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';
import BigNumber from 'bignumber.js';
import { formatter } from '../../hooks/balance';
import { Body1 } from '../Text';

const SentenceInput = styled.input`
    padding: 0;
    margin: 0;
    border: none;
    outline: none;
    font-size: inherit;
    background: transparent;
    color: ${props => props.theme.textPrimary};

    font-family: 'Montserrat', sans-serif;
    font-style: normal;
    font-weight: 600;

    line-height: 49px;
    text-align: right;

    -moz-appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
        -webkit-appearance: none;
    }
`;

interface InputSize {
    fontSize: number;
    width: number;
}

interface InputProps {
    value: string;
    setValue: (value: string) => void;
}

export const Sentence = React.forwardRef<HTMLInputElement, InputProps & { inputSize: InputSize }>(
    ({ value, setValue, inputSize }, ref) => {
        return (
            <SentenceInput
                autoComplete="off"
                id="sentence"
                ref={ref}
                style={{
                    fontSize: `${inputSize.fontSize}px`,
                    width: `${inputSize.width}px`
                }}
                inputMode="decimal"
                type="text"
                value={value}
                onChange={event => {
                    setValue(event.target.value);
                }}
            />
        );
    }
);
Sentence.displayName = 'Sentence';

const getInputSize = (
    value: string,
    originalFontSize: number,
    parent: HTMLLabelElement,
    label: HTMLSpanElement
) => {
    const max = parent.clientWidth - label.clientWidth - 1;
    let fontSize = originalFontSize;
    let width = getTextWidth(value, `600 ${fontSize}px 'Montserrat'`);

    let iteration = 0;
    while (Math.round(width) > max - 115) {
        fontSize = Math.max(1, fontSize - 1);
        width = getTextWidth(value, `600 ${fontSize}px 'Montserrat'`);
        iteration = iteration + 1;
        if (iteration > 100) {
            return {
                width: Math.max(Math.round(width) + 5, value.length * 6, 30),
                fontSize
            };
        }
    }

    return {
        width: Math.max(Math.round(width) + 5, value.length * 6, 30),
        fontSize
    };
};

const AmountBlock = styled.label`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28px 1rem;
    box-sizing: border-box;
    position: relative;
    width: 100%;
    border-radius: ${props => props.theme.cornerSmall};
    background: ${props => props.theme.backgroundContent};
`;

const InputBlock = styled.div`
    display: flex;
    align-items: center;
`;

const Symbol = styled.span<{ $fontSize: number }>`
    color: ${props => props.theme.textSecondary};
    padding-left: 12px;
    white-space: pre;
    font-weight: 600;

    font-size: ${p => p.$fontSize}px;

    @media (max-width: 600px) {
        padding-left: 8px;
    }
`;

const SecondCurrencyBlock = styled(Body1)`
    display: flex;
    align-items: center;
    cursor: pointer;
    z-index: 2;

    padding: 8px 16px;

    color: ${props => props.theme.textSecondary};
    border: 1px solid ${props => props.theme.buttonTertiaryBackground};
    border-radius: ${props => props.theme.cornerLarge};

    max-width: 80%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: pre;

    user-select: none;
`;

export interface InputCurrency {
    id: string;
    label: ReactNode;
    decimals: number;
}

export const AmountDoubleInput = forwardRef<
    HTMLInputElement,
    {
        className?: string;
        fontSize?: number;
        currencies: InputCurrency[];
        rate: number | BigNumber | ((val: { currencyId: string; value: BigNumber }) => BigNumber);
        onChange?: (val: { currencyId: string; input: BigNumber }) => void;
    }
>(({ onChange, currencies, className, fontSize = 28, rate }, ref) => {
    const containerRef = useRef<HTMLLabelElement | null>(null);
    const labelRef = useRef<HTMLSpanElement | null>(null);
    const [size, setSize] = useState({
        fontSize,
        width: 30
    });

    const [currencyAmount, setCurrencyAmount] = useState({
        activeCurrencyId: currencies[0].id,
        value1: '',
        value2: '',
        inputValue: ''
    });

    useLayoutEffect(() => {
        if (containerRef.current && labelRef.current && containerRef.current.clientWidth) {
            setSize(
                getInputSize(
                    currencyAmount.inputValue,
                    fontSize,
                    containerRef.current,
                    labelRef.current
                )
            );
        }
    }, [currencyAmount.inputValue, fontSize]);

    const inputValueToBN = (v: string) =>
        new BigNumber(removeGroupSeparator(v).replace(getDecimalSeparator(), '.'));

    const onInput = (newValue: string) => {
        const decimals = currencies.find(c => c.id === currencyAmount.activeCurrencyId)!.decimals;

        let inputValue = replaceTypedDecimalSeparator(newValue);

        if (!inputValue) {
            setCurrencyAmount(s => ({
                ...s,
                inputValue,
                value1: '',
                value2: ''
            }));
            onChange?.({
                currencyId: currencyAmount.activeCurrencyId,
                input: new BigNumber(0)
            });
            return;
        }

        if (!seeIfValueValid(inputValue, decimals)) {
            onChange?.({
                currencyId: currencyAmount.activeCurrencyId,
                input: new BigNumber(0)
            });
            return;
        }

        let value1 = currencyAmount.value1;
        let value2 = currencyAmount.value2;

        if (isNumeric(inputValue) && !inputValue.endsWith(getDecimalSeparator())) {
            const formattedInput = formatSendValue(inputValue);
            const bnInput = inputValueToBN(inputValue);

            if (currencyAmount.activeCurrencyId === currencies[1].id) {
                const bnValue1 =
                    typeof rate === 'function'
                        ? rate({ currencyId: currencyAmount.activeCurrencyId, value: bnInput })
                        : bnInput.div(rate);

                value1 = formatter.format(bnValue1, {
                    decimals: currencies[0].decimals
                });

                value2 = formattedInput;
            } else {
                const bnValue2 =
                    typeof rate === 'function'
                        ? rate({ currencyId: currencyAmount.activeCurrencyId, value: bnInput })
                        : bnInput.multipliedBy(rate);

                value2 = formatter.format(bnValue2, {
                    decimals: currencies[1].decimals
                });

                value1 = formattedInput;
            }

            inputValue = formatSendValue(inputValue);
        }

        onChange?.({
            currencyId: currencyAmount.activeCurrencyId,
            input: inputValueToBN(
                currencyAmount.activeCurrencyId === currencies[0].id ? value1 : value2
            )
        });

        setCurrencyAmount({
            activeCurrencyId: currencyAmount.activeCurrencyId,
            inputValue,
            value1,
            value2
        });
    };

    const onToggleCurrency = () => {
        setCurrencyAmount(s => ({
            ...s,
            activeCurrencyId:
                s.activeCurrencyId === currencies[0].id ? currencies[1].id : currencies[0].id,
            inputValue: s.activeCurrencyId === currencies[0].id ? s.value2 : s.value1
        }));

        onChange?.({
            currencyId:
                currencyAmount.activeCurrencyId === currencies[0].id
                    ? currencies[1].id
                    : currencies[0].id,
            input: inputValueToBN(
                currencyAmount.activeCurrencyId === currencies[0].id
                    ? currencyAmount.value2
                    : currencyAmount.value1
            )
        });
    };

    useEffect(() => {
        onInput(currencyAmount.inputValue);
    }, [currencies]);

    const activeCurrency = currencies.find(c => c.id === currencyAmount.activeCurrencyId)!;
    const notActiveCurrency = currencies.find(c => c.id !== currencyAmount.activeCurrencyId)!;

    return (
        <AmountBlock ref={containerRef} className={className}>
            <InputBlock>
                <Sentence
                    ref={ref}
                    value={currencyAmount.inputValue}
                    setValue={onInput}
                    inputSize={size}
                />
                <Symbol ref={labelRef} $fontSize={size.fontSize}>
                    {activeCurrency.label}
                </Symbol>
            </InputBlock>
            <SecondCurrencyBlock onClick={onToggleCurrency}>
                {(currencyAmount.activeCurrencyId === currencies[0].id
                    ? currencyAmount.value2
                    : currencyAmount.value1) || `0${getDecimalSeparator()}00`}{' '}
                {notActiveCurrency.label}
            </SecondCurrencyBlock>
        </AmountBlock>
    );
});
