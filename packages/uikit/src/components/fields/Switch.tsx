import React, { FC, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';

export interface SwitchProps {
    checked: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}

const Wrapper = styled.div<{ disabled?: boolean }>`
    position: relative;
    margin: -5px 0 -5px 0;
    width: 51px;
    display: inline-block;
    vertical-align: middle;
    text-align: left;
    cursor: pointer;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    ${props =>
        props.disabled &&
        css`
            opacity: 0.48;
        `}
`;

const Label = styled.div`
    display: block;
    overflow: hidden;
    cursor: pointer;
    border: 0 solid ${props => props.theme.textPrimary};
    border-radius: 20px;
    margin: 0;
    box-sizing: border-box;
`;

const Inner = styled.span<{ checked?: boolean; active: boolean }>`
    display: block;
    width: 200%;
    margin-left: -100%;
    will-change: margin;
    ${props =>
        props.active &&
        css`
            transition: margin 0.2s ease-in-out;
        `}

    &:before,
    &:after {
        display: block;
        float: left;
        width: 50%;
        height: 32px;
        padding: 0;
        line-height: 32px;
        font-size: 14px;
        font-weight: bold;
        box-sizing: border-box;
    }

    &:before {
        content: '';
        text-transform: uppercase;
        padding-left: 10px;
        background-color: ${props => props.theme.buttonPrimaryBackground};
        color: ${props => props.theme.textPrimary};
    }

    &:after {
        content: '';
        text-transform: uppercase;
        padding-right: 10px;
        background-color: ${props => props.theme.backgroundContentTint};
        color: ${props => props.theme.textPrimary};
        text-align: right;
    }

    ${props =>
        props.checked &&
        css`
            margin-left: 0;
        `}
`;

const Outer = styled.span<{ checked?: boolean; active: boolean }>`
    display: block;
    width: 28px;
    height: 28px;
    margin: 2px;
    background: ${props => props.theme.textPrimary};
    position: absolute;
    top: 0;
    bottom: 0;
    transform: translateX(${props => (props.checked ? '19px' : '0')});
    border-radius: 20px;
    will-change: transform;
    ${props =>
        props.active &&
        css`
            transition: transform 0.2s ease-in-out;
        `}
`;

const useActive = () => {
    const [active, setActive] = useState(false);
    useEffect(() => {
        const timeout = setTimeout(() => setActive(true), 0);
        return () => clearTimeout(timeout);
    }, []);
    return active;
};

export const Switch: FC<SwitchProps> = React.memo(({ checked, onChange, disabled, className }) => {
    const active = useActive();
    return (
        <Wrapper
            className={className}
            disabled={disabled}
            onClick={e => {
                if (!disabled && onChange) {
                    e.stopPropagation();
                    onChange(!checked);
                }
            }}
        >
            <Label>
                <Inner checked={checked} active={active} />
                <Outer checked={checked} active={active} />
            </Label>
        </Wrapper>
    );
});
