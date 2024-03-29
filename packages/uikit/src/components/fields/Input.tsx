import React, { ReactNode, useState } from 'react';
import styled, { css } from 'styled-components';
import { XmarkIcon } from '../Icon';
import { Body2 } from '../Text';
import { TextareaAutosize } from './TextareaAutosize';

export const InputBlock = styled.div<{
    focus: boolean;
    valid: boolean;
    isSuccess?: boolean;
    scanner?: boolean;
    clearButton?: boolean;
}>`
    width: 100%;
    min-height: 64px;
    border-radius: ${props => props.theme.cornerSmall};
    display: flex;
    padding: 0 1rem;
    gap: 0.5rem;
    box-sizing: border-box;
    position: relative;

    ${props =>
        props.scanner &&
        css`
            padding-right: 3.5rem;
        `}

    ${props =>
        props.clearButton &&
        css`
            padding-right: 2rem;
        `}

  &:focus-within label {
        transform: translate(0, 12px) scale(0.7);
    }

    ${props =>
        !props.valid
            ? css`
                  border: 1px solid ${props.theme.fieldErrorBorder};
                  background: ${props.theme.fieldErrorBackground};

                  &:focus-within label {
                      color: ${p => p.theme.fieldErrorBorder};
                  }
              `
            : props.focus
            ? css`
                  border: 1px solid ${props.theme.fieldActiveBorder};
                  background: ${props.theme.fieldBackground};
              `
            : css`
                  border: 1px solid ${props.theme.fieldBackground};
                  background: ${props.theme.fieldBackground};
              `}

    ${props =>
        props.isSuccess &&
        css`
            border: 1px solid ${props.theme.accentGreen};
        `}
`;

export const InputField = styled.input<{ marginRight?: string }>`
    outline: none;
    border: none;
    background: transparent;
    flex-grow: 1;
    font-weight: 500;
    font-size: 16px;
    padding: 30px 0 10px;
    box-sizing: border-box;

    color: ${props => props.theme.textPrimary};
    ${props =>
        props.marginRight &&
        css`
            margin-right: ${props.marginRight};
        `};
`;

export const Label = styled.label<{ active?: boolean }>`
    user-select: none;

    position: absolute;
    pointer-events: none;
    transform: translate(0, 23px) scale(1);
    transform-origin: top left;
    transition: 200ms cubic-bezier(0, 0, 0.2, 1) 0ms;
    color: ${props => props.theme.textSecondary};
    font-size: 16px;
    line-height: 1;
    left: 1rem;

    ${props =>
        props.active &&
        css`
            transform: translate(0, 12px) scale(0.7);
        `}
`;

export const OuterBlock = styled.div`
    width: 100%;
`;
export const HelpText = styled(Body2)<{ valid: boolean }>`
    user-select: none;
    display: inline-block;
    width: 100%;
    text-align: left;
    margin-top: 12px;

    ${props =>
        props.valid
            ? css`
                  color: ${p => p.theme.textSecondary};
              `
            : css`
                  color: ${p => p.theme.fieldErrorBorder};
              `}
`;

const RightBlock = styled.div`
    position: absolute;
    right: 1rem;
    height: 100%;
    display: flex;
    align-items: center;
`;

const ClearBlock = styled(RightBlock)`
    cursor: pointer;
    color: ${props => props.theme.textSecondary};

    &:hover {
        color: ${props => props.theme.textTertiary};
    }
`;

export interface InputProps {
    type?: 'password' | undefined;
    value: string;
    onChange?: (value: string) => void;
    onSubmit?: () => void;
    isValid?: boolean;
    isSuccess?: boolean;
    label?: string;
    disabled?: boolean;
    helpText?: string;
    tabIndex?: number;
    clearButton?: boolean;
    rightElement?: ReactNode;
    marginRight?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            type,
            value,
            onChange,
            isValid = true,
            isSuccess = false,
            label,
            disabled,
            helpText,
            tabIndex,
            clearButton,
            rightElement,
            marginRight
        },
        ref
    ) => {
        const [focus, setFocus] = useState(false);

        const onClear: React.MouseEventHandler<HTMLDivElement> = e => {
            e.stopPropagation();
            e.preventDefault();
            if (disabled) return;
            onChange?.('');
        };

        return (
            <OuterBlock>
                <InputBlock
                    focus={focus}
                    valid={isValid}
                    isSuccess={isSuccess}
                    clearButton={clearButton}
                >
                    <InputField
                        ref={ref}
                        disabled={disabled}
                        type={type}
                        value={value}
                        spellCheck={false}
                        tabIndex={tabIndex}
                        marginRight={marginRight}
                        onChange={e => onChange && onChange(e.target.value)}
                        onFocus={() => setFocus(true)}
                        onBlur={() => setFocus(false)}
                    />
                    {label && <Label active={value !== ''}>{label}</Label>}
                    {rightElement && <RightBlock onClick={onClear}>{rightElement}</RightBlock>}
                    {!!value && clearButton && !rightElement && (
                        <ClearBlock onClick={onClear}>
                            <XmarkIcon />
                        </ClearBlock>
                    )}
                </InputBlock>
                {helpText && <HelpText valid={isValid}>{helpText}</HelpText>}
            </OuterBlock>
        );
    }
);

export const TextArea = React.forwardRef<HTMLTextAreaElement, InputProps>(
    ({ value, onChange, isValid = true, label, disabled, helpText, onSubmit }, ref) => {
        const [focus, setFocus] = useState(false);

        return (
            <OuterBlock>
                <InputBlock focus={focus} valid={isValid}>
                    <TextareaAutosize
                        onSubmit={onSubmit}
                        ref={ref}
                        disabled={disabled}
                        value={value}
                        onChange={e => onChange && onChange(e.target.value)}
                        onFocus={() => setFocus(true)}
                        onBlur={() => setFocus(false)}
                    />
                    {label && <Label active={value !== ''}>{label}</Label>}
                </InputBlock>
                {helpText && <HelpText valid={isValid}>{helpText}</HelpText>}
            </OuterBlock>
        );
    }
);
