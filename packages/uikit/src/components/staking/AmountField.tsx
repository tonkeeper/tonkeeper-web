import { ChangeEvent, FC, ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { styled } from 'styled-components';
import { Body2, Body2Class, Body3 } from '../Text';
import { getDecimalSeparator, getNotDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';
import { removeGroupSeparator } from '@tonkeeper/core/dist/utils/send';
import { replaceTypedDecimalSeparator, seeIfValueValid } from '../transfer/amountView/AmountViewUI';

const STAKING_AMOUNT_DECIMALS = 9;

const FieldContainer = styled.div`
    flex: 1;
    min-width: 0;
`;

const InputBorderedBox = styled.label<{ $disabled?: boolean }>`
    background: ${p => p.theme.fieldBackground};
    border: 1px solid ${p => p.theme.fieldBackground};
    border-radius: ${p =>
        p.theme.displayType === 'full-width' ? p.theme.corner2xSmall : p.theme.cornerSmall};
    transition: border-color 0.15s ease-in-out;
    display: flex;
    align-items: center;
    padding: 0 12px;
    height: 52px;
    box-sizing: border-box;
    gap: 8px;
    cursor: ${p => (p.$disabled ? 'default' : 'text')};

    &:focus-within {
        border-color: ${p => p.theme.fieldActiveBorder};
    }
`;

const InputLeft = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
`;

const AmountMeasureText = styled.span`
    position: absolute;
    left: 0;
    top: 0;
    visibility: hidden;
    white-space: pre;
    pointer-events: none;
    font-family: inherit;
    ${Body2Class}
`;

const INPUT_CARET_EXTRA_PX = 2;

const AmountInputStyled = styled.input<{ $widthPx: number }>`
    border: none;
    background: none;
    text-align: left;
    outline: none;
    color: ${p => p.theme.textPrimary};
    font-family: inherit;
    min-width: 0;
    width: ${p => Math.max(p.$widthPx, 10)}px;

    ${Body2Class}

    &::placeholder {
        color: ${p => p.theme.textTertiary};
    }

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    -moz-appearance: textfield;
`;

const TokenLabel = styled.span`
    font-size: 14px;
    color: ${p => p.theme.textSecondary};
    flex-shrink: 0;
`;

const FiatAmount = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    text-align: right;
    flex-shrink: 0;
    white-space: nowrap;
`;

const FieldFooter = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 4px 12px;
    min-height: 20px;
    gap: 12px;
`;

export const ErrorText = styled(Body3)`
    color: ${p => p.theme.accentRed};
`;

export const BalanceLabel = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

export const MaxButton = styled.button`
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
    color: ${p => p.theme.accentBlue};
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
`;

function amountPropToDisplay(amount: string): string {
    if (!amount) return '';
    return amount.replace('.', getDecimalSeparator());
}

function displayToAmountProp(display: string): string {
    if (!display) return '';
    const decSep = getDecimalSeparator();
    const normalized = removeGroupSeparator(display);
    const [whole, fraction] = normalized.split(decSep);
    if (fraction === undefined) return whole;
    return fraction.length ? `${whole}.${fraction}` : `${whole}.`;
}

function sanitizeDecimalInput(raw: string): string {
    let s = replaceTypedDecimalSeparator(raw);
    const decSep = getDecimalSeparator();
    const altSep = getNotDecimalSeparator();
    const trimmed = s.trim();
    if (trimmed.length === 1 && (trimmed === decSep || trimmed === altSep)) {
        return decSep;
    }

    s = removeGroupSeparator(s);
    let out = '';
    let hasSep = false;
    for (const ch of s) {
        if (ch >= '0' && ch <= '9') {
            out += ch;
        } else if ((ch === decSep || ch === altSep) && !hasSep) {
            out += decSep;
            hasSep = true;
        }
    }
    return out;
}

function normalizeIntegerLeadingZeros(display: string, decSep: string): string {
    const parts = display.split(decSep);
    const whole = parts[0] ?? '';
    const fraction = parts.length > 1 ? parts.slice(1).join(decSep) : undefined;

    let newWhole: string;
    if (fraction !== undefined) {
        const stripped = whole.replace(/^0+/, '');
        newWhole = stripped === '' ? '0' : stripped;
    } else {
        const stripped = whole.replace(/^0+/, '');
        newWhole = stripped === '' ? '0' : stripped;
    }

    return fraction !== undefined ? `${newWhole}${decSep}${fraction}` : newWhole;
}

export interface AmountFieldProps {
    amount: string;
    onChange: (value: string) => void;
    fiatDisplay: string;
    disabled?: boolean;
    footer: ReactNode;
}

export const AmountField: FC<AmountFieldProps> = ({
    amount,
    onChange,
    fiatDisplay,
    disabled,
    footer
}) => {
    const [inputValue, setInputValue] = useState(() => amountPropToDisplay(amount));
    const prevDisplayRef = useRef<string>(amountPropToDisplay(amount));

    useEffect(() => {
        const d = amountPropToDisplay(amount);
        setInputValue(d);
        prevDisplayRef.current = d;
    }, [amount]);

    const measureRef = useRef<HTMLSpanElement>(null);
    const [inputWidthPx, setInputWidthPx] = useState(0);

    const widthMeasureSource = inputValue || '0';

    useLayoutEffect(() => {
        const el = measureRef.current;
        if (!el) return;
        const w = el.getBoundingClientRect().width;
        setInputWidthPx(Math.ceil(w) + INPUT_CARET_EXTRA_PX);
    }, [widthMeasureSource]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const decSep = getDecimalSeparator();
        let processed = sanitizeDecimalInput(raw);

        if (processed === '') {
            prevDisplayRef.current = '';
            setInputValue('');
            onChange('');
            return;
        }

        if (processed === decSep) {
            processed = `0${decSep}`;
        }

        if (processed === '0') {
            const prev = prevDisplayRef.current;
            if (prev === '') {
                processed = `0${decSep}`;
            } else if (prev === `0${decSep}` && raw.length < prev.length) {
                processed = '0';
            }
        }

        processed = normalizeIntegerLeadingZeros(processed, decSep);

        if (!seeIfValueValid(processed, STAKING_AMOUNT_DECIMALS)) {
            return;
        }

        prevDisplayRef.current = processed;
        setInputValue(processed);
        onChange(displayToAmountProp(processed));
    };

    return (
        <FieldContainer>
            <InputBorderedBox $disabled={disabled}>
                <InputLeft>
                    <AmountMeasureText ref={measureRef} aria-hidden>
                        {widthMeasureSource}
                    </AmountMeasureText>
                    <AmountInputStyled
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={inputValue}
                        onChange={handleChange}
                        placeholder="0"
                        $widthPx={inputWidthPx}
                        disabled={disabled}
                    />
                    <TokenLabel>TON</TokenLabel>
                </InputLeft>
                <FiatAmount>{fiatDisplay}</FiatAmount>
            </InputBorderedBox>
            <FieldFooter>{footer}</FieldFooter>
        </FieldContainer>
    );
};
