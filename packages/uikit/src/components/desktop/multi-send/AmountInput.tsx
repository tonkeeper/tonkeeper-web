import React, { FC, useEffect, useId, useRef, useState } from 'react';
import { ControllerFieldState, ControllerRenderProps } from 'react-hook-form/dist/types/controller';
import { useAppContext } from '../../../hooks/appContext';
import { useRate } from '../../../state/rates';
import {
    replaceTypedDecimalSeparator,
    seeIfValueValid
} from '../../transfer/amountView/AmountViewUI';
import { formatSendValue, isNumeric, removeGroupSeparator } from '@tonkeeper/core/dist/utils/send';
import { getDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';
import BigNumber from 'bignumber.js';
import { formatter } from '../../../hooks/balance';
import { InputBlockStyled, InputFieldStyled } from './InputStyled';
import styled, { css } from 'styled-components';
import { Body2 } from '../../Text';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';

const AmountInputFieldStyled = styled(InputFieldStyled)<{ color?: string }>`
    text-align: right;
    min-width: 1px;
    flex: 1;

    transition: color 0.1s ease-in-out;

    &:disabled {
        cursor: not-allowed;
    }

    ${p =>
        p.color &&
        css`
            color: ${p.theme[p.color]};
        `};
`;

const AmountInputFieldRight = styled(Body2)<{ color?: string; isDisabled?: boolean }>`
    height: fit-content;
    align-self: center;

    transition: color 0.1s ease-in-out;

    ${p =>
        p.isDisabled &&
        css`
            cursor: not-allowed;
        `}

    ${p =>
        p.color &&
        css`
            color: ${p.theme[p.color]};
        `};
`;

export const AmountInput: FC<{
    field: ControllerRenderProps<
        {
            rows: {
                amount: { inFiat: boolean; value: string } | null;
            }[];
        },
        `rows.${number}.amount`
    >;
    asset: TonAsset;
    fieldState: ControllerFieldState;
}> = ({ asset, fieldState, field }) => {
    const { fiat } = useAppContext();
    const [focus, setFocus] = useState(false);
    const [currencyAmount, setCurrencyAmount] = useState({
        inFiat: false,
        tokenValue: '',
        fiatValue: '',
        inputValue: ''
    });

    const { data, isFetched } = useRate(
        typeof asset.address === 'string' ? asset.address : asset.address.toRawString()
    );

    const price = data?.prices || 0;
    const isFiatInputDisabled = !price;

    const onInput = (inFiat: boolean, newValue: string) => {
        const decimals = currencyAmount.inFiat ? 2 : asset.decimals;

        let inputValue = replaceTypedDecimalSeparator(newValue);

        if (!inputValue) {
            setCurrencyAmount(s => ({
                ...s,
                inputValue,
                tokenValue: '',
                fiatValue: ''
            }));
            field.onChange({
                inFiat,
                value: ''
            });
            return;
        }

        if (!seeIfValueValid(inputValue, decimals)) {
            field.onChange({
                inFiat,
                value: ''
            });
            return;
        }

        let tokenValue = currencyAmount.tokenValue;
        let fiatValue = currencyAmount.fiatValue;

        if (isNumeric(inputValue) && !inputValue.endsWith(getDecimalSeparator())) {
            const formattedInput = formatSendValue(inputValue);
            const bnInput = new BigNumber(
                removeGroupSeparator(inputValue).replace(getDecimalSeparator(), '.')
            );
            if (inFiat) {
                tokenValue = formatter.format(!price ? new BigNumber(0) : bnInput.div(price), {
                    decimals: asset.decimals
                });

                fiatValue = formattedInput;
            } else {
                fiatValue = formatter.format(bnInput.multipliedBy(price), { decimals: 2 });

                tokenValue = formattedInput;
            }

            inputValue = formatSendValue(inputValue);
        }

        field.onChange({
            inFiat,
            value: inFiat ? fiatValue : tokenValue
        });

        setCurrencyAmount({
            inFiat,
            inputValue,
            tokenValue,
            fiatValue
        });
    };

    useEffect(() => {
        if (!field.value || !isFetched) {
            return;
        }

        if (!price && field.value.inFiat) {
            setCurrencyAmount({ inFiat: false, tokenValue: '', fiatValue: '', inputValue: '' });
            field.onChange(null);
        } else {
            onInput(field.value.inFiat, field.value.value);
        }
    }, [price, isFetched]);

    const tokenId = useId();
    const fiatId = useId();
    const tokenRef = useRef<HTMLInputElement | null>(null);
    const fiatRef = useRef<HTMLInputElement | null>(null);

    const onFocus = (inFiat: boolean) => {
        setFocus(true);
        if (inFiat !== currencyAmount.inFiat) {
            setCurrencyAmount(s => ({
                ...s,
                inFiat,
                inputValue: inFiat ? s.fiatValue : s.tokenValue
            }));

            field.onChange({
                inFiat,
                value: inFiat ? currencyAmount.fiatValue : currencyAmount.tokenValue
            });
        }
    };

    const onBlur = () => {
        const activeId = document.activeElement?.id;
        if (activeId !== tokenId && activeId !== fiatId) {
            setFocus(false);
            field.onBlur();
        }
    };

    return (
        <InputBlockStyled valid={!fieldState.invalid} focus={focus}>
            <AmountInputFieldStyled
                id={tokenId}
                onFocus={() => onFocus(false)}
                onBlur={onBlur}
                placeholder="0"
                onChange={e => onInput(false, e.target.value)}
                value={
                    currencyAmount.inFiat ? currencyAmount.tokenValue : currencyAmount.inputValue
                }
                color={currencyAmount.inFiat ? 'textTertiary' : 'textPrimary'}
                type="text"
                ref={tokenRef}
            />
            <AmountInputFieldRight
                color={
                    currencyAmount.inFiat || (!currencyAmount.inputValue && !focus)
                        ? 'textTertiary'
                        : 'textPrimary'
                }
                onClick={() => {
                    tokenRef.current?.focus();
                    onFocus(false);
                }}
            >
                {asset.symbol}
            </AmountInputFieldRight>
            <AmountInputFieldStyled
                id={fiatId}
                onFocus={() => onFocus(true)}
                onBlur={onBlur}
                placeholder="0"
                onChange={e => onInput(true, e.target.value)}
                value={currencyAmount.inFiat ? currencyAmount.inputValue : currencyAmount.fiatValue}
                color={currencyAmount.inFiat ? 'textPrimary' : 'textTertiary'}
                type="text"
                autoComplete="off"
                disabled={isFiatInputDisabled}
                ref={fiatRef}
            />
            <AmountInputFieldRight
                color={currencyAmount.inFiat ? 'textPrimary' : 'textTertiary'}
                isDisabled={isFiatInputDisabled}
                onClick={() => {
                    if (isFiatInputDisabled) {
                        return;
                    }
                    fiatRef.current?.focus();
                    onFocus(true);
                }}
            >
                {fiat}
            </AmountInputFieldRight>
        </InputBlockStyled>
    );
};
