import React, { FC, forwardRef, PropsWithChildren, useId } from 'react';
import styled, { css, DefaultTheme } from 'styled-components';
import { CheckboxIcon } from '../Icon';
import { Body1 } from '../Text';
import { ChangeHandler } from 'react-hook-form';

export interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    light?: boolean;
    className?: string;
    borderColor?: keyof DefaultTheme;
    size?: 's' | 'm';
}

const Wrapper = styled.div`
    display: inline-flex;
    gap: 8px;
    align-items: center;

    cursor: pointer;
`;

const IconBase = styled.div<{ checked: boolean; disabled?: boolean; $borderColor: string }>`
    display: flex;
    align-items: center;
    justify-content: center;

    border-width: 2px;
    border-style: solid;
    box-sizing: border-box;

    ${props =>
        props.disabled
            ? css`
                  opacity: 0.48;
              `
            : undefined}

    ${props =>
        props.checked
            ? css`
                  color: ${props.theme.buttonPrimaryForeground};
                  background: ${props.theme.buttonPrimaryBackground};
                  border-color: ${props.theme.buttonPrimaryBackground};
              `
            : css`
                  color: transparent;
                  background: transparent;
                  border-color: ${props.theme[props.$borderColor]};
              `}
`;
const CheckboxItem = styled(IconBase)<{ $size: 's' | 'm' }>`
    border-radius: 6px;

    ${props =>
        props.$size === 's'
            ? css`
                  width: 18px;
                  height: 18px;
              `
            : css`
                  width: 22px;
                  height: 22px;
              `}
`;

const RadioInput = styled.input`
    display: none;

    &:checked + label {
        &::after {
            background: ${p => p.theme.buttonPrimaryBackground};
        }

        &::before {
            border-color: ${props => props.theme.buttonPrimaryBackground};
        }
    }
`;

const RadioLabel = styled.label`
    padding-left: 28px;
    position: relative;
    cursor: pointer;

    &::before {
        box-sizing: border-box;
        content: '';
        display: block;
        transition: border-color 0.15s ease-in-out;
        width: 20px;
        height: 20px;
        background: transparent;
        border-radius: ${props => props.theme.cornerFull};
        border-color: ${props => props.theme.backgroundContentTint};
        border-width: 2px;
        border-style: solid;
        position: absolute;
        top: calc(50% - 10px);
        left: 0;
        cursor: pointer;
    }

    &::after {
        transition: background 0.15s ease-in-out;
        border-radius: ${props => props.theme.cornerFull};
        position: absolute;
        top: calc(50% - 5px);
        left: 5px;
        content: '';
        display: block;
        width: 10px;
        height: 10px;
        background: transparent;
        cursor: pointer;
    }
`;

const Text = styled(Body1)<{ light?: boolean }>`
    color: ${props => (props.light ? props.theme.textPrimary : props.theme.textSecondary)};
`;

export const Checkbox: FC<PropsWithChildren<CheckboxProps>> = ({
    checked,
    onChange,
    disabled,
    children,
    light,
    className,
    borderColor = 'backgroundContentTint',
    size = 'm'
}) => {
    return (
        <Wrapper onClick={() => onChange(!checked)} className={className}>
            <CheckboxItem
                checked={checked}
                disabled={disabled}
                $borderColor={borderColor.toString()}
                $size={size}
            >
                {checked ? <CheckboxIcon /> : undefined}
            </CheckboxItem>
            {children && <Text light={light}>{children}</Text>}
        </Wrapper>
    );
};

export const Radio = forwardRef<
    HTMLInputElement,
    PropsWithChildren<{
        className?: string;
        checked?: boolean;
        onChange?: ChangeHandler | ((event: { target: unknown; type?: unknown }) => void);
        disabled?: boolean;
        value?: string;
    }>
>(({ children, className, ...rest }, ref) => {
    const id = useId();
    return (
        <>
            <RadioInput type="radio" ref={ref} id={id} {...rest} />
            <RadioLabel className={className} htmlFor={id}>
                {children && <Text>{children}</Text>}
            </RadioLabel>
        </>
    );
});
