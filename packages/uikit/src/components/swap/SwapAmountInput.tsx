import { FC, useEffect, useState } from 'react';
import { styled } from 'styled-components';
import { Num2Class } from '../Text';
import BigNumber from 'bignumber.js';
import { getDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';
import { replaceTypedDecimalSeparator, seeIfValueValid } from '../transfer/amountView/AmountViewUI';
import {
    formatNumberValue,
    formatSendValue,
    isNumeric,
    removeGroupSeparator
} from '@tonkeeper/core/dist/utils/send';

const AmountInputWrapper = styled.input`
    border: none;
    background: none;
    text-align: right;
    outline: none;
    width: 30px;
    color: ${p => p.theme.textPrimary};
    font-family: inherit;

    ${Num2Class}

    &::placeholder {
        color: ${p => p.theme.textTertiary};
    }
`;

export const SwapAmountInput: FC<{
    value: BigNumber | undefined;
    onChange: (value: BigNumber | undefined) => void;
    decimals: number;
    className?: string;
}> = ({ value, onChange, decimals, className }) => {
    const [input, setInput] = useState('');

    const onInput = (newValue: string) => {
        let inputValue = replaceTypedDecimalSeparator(newValue);

        if (!inputValue) {
            setInput('');
            onChange(undefined);
            return;
        }

        if (!seeIfValueValid(inputValue, decimals)) {
            return;
        }

        if (isNumeric(inputValue)) {
            if (!inputValue.endsWith(getDecimalSeparator())) {
                const bnInput = new BigNumber(
                    removeGroupSeparator(inputValue).replace(getDecimalSeparator(), '.')
                );
                const prevBnInput = new BigNumber(
                    removeGroupSeparator(input).replace(getDecimalSeparator(), '.')
                );
                if (!bnInput.eq(prevBnInput)) {
                    onChange(bnInput);
                    inputValue = formatSendValue(inputValue);
                }
            }

            setInput(inputValue);
        }
    };

    useEffect(() => {
        if (!value) {
            setInput('');
        } else {
            setInput(formatNumberValue(value));
        }
    }, [value]);

    const decimalSeparator = getDecimalSeparator();
    return (
        <AmountInputWrapper
            value={input}
            onChange={e => onInput(e.target.value)}
            placeholder={`0${decimalSeparator}00`}
            className={className}
        />
    );
};
