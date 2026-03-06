import { FC, ReactNode } from 'react';
import { styled } from 'styled-components';
import { Body2, Body2Class, Body3 } from '../Text';

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
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
`;

const AmountInputStyled = styled.input<{ $isErrored: boolean; $width: number }>`
    border: none;
    background: none;
    text-align: left;
    outline: none;
    color: ${p => (p.$isErrored ? p.theme.accentRed : p.theme.textPrimary)};
    font-family: inherit;
    min-width: 1ch;
    width: ${p => p.$width}ch;

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
    align-items: center;
    padding: 4px 12px;
    min-height: 20px;
    gap: 4px;
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

export interface AmountFieldProps {
    amount: string;
    onChange: (value: string) => void;
    fiatDisplay: string;
    isErrored?: boolean;
    disabled?: boolean;
    footer: ReactNode;
}

export const AmountField: FC<AmountFieldProps> = ({
    amount,
    onChange,
    fiatDisplay,
    isErrored,
    disabled,
    footer
}) => (
    <FieldContainer>
        <InputBorderedBox $disabled={disabled}>
            <InputLeft>
                <AmountInputStyled
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={e => onChange(e.target.value)}
                    placeholder="0"
                    inputMode="decimal"
                    $isErrored={!!isErrored}
                    $width={Math.max(1, (amount || '0').length)}
                    disabled={disabled}
                />
                <TokenLabel>TON</TokenLabel>
            </InputLeft>
            <FiatAmount>{fiatDisplay}</FiatAmount>
        </InputBorderedBox>
        <FieldFooter>{footer}</FieldFooter>
    </FieldContainer>
);
