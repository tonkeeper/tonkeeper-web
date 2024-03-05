import React, { FC, PropsWithChildren } from 'react';
import styled, { css } from 'styled-components';
import { CheckboxIcon } from '../Icon';
import { Body1 } from '../Text';

export interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    light?: boolean;
    className?: string;
}

const Wrapper = styled.div`
    display: inline-flex;
    gap: 15px;
    align-items: center;

    cursor: pointer;
`;

const IconBase = styled.div<{ checked: boolean; disabled?: boolean }>`
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
                  border-color: ${props.theme.backgroundContentTint};
              `}
`;
const CheckboxItem = styled(IconBase)`
    width: 22px;
    height: 22px;

    border-radius: 6px;
`;

const RadioItem = styled(IconBase)`
    width: 24px;
    height: 24px;

    border-radius: ${props => props.theme.cornerFull};
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
    className
}) => {
    return (
        <Wrapper onClick={() => onChange(!checked)} className={className}>
            <CheckboxItem checked={checked} disabled={disabled}>
                {checked ? <CheckboxIcon /> : undefined}
            </CheckboxItem>
            {children && <Text light={light}>{children}</Text>}
        </Wrapper>
    );
};

export const Radio: FC<PropsWithChildren<CheckboxProps>> = ({
    checked,
    onChange,
    disabled,
    children
}) => {
    return (
        <Wrapper
            onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                onChange(!checked);
            }}
        >
            <RadioItem checked={checked} disabled={disabled}>
                {checked ? <CheckboxIcon /> : undefined}
            </RadioItem>
            {children && <Text>{children}</Text>}
        </Wrapper>
    );
};
