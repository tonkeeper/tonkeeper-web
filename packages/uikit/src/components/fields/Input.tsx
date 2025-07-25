import React, { InputHTMLAttributes, ReactNode, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { XmarkIcon } from '../Icon';
import { Body2 } from '../Text';
import { TextareaAutosize } from './TextareaAutosize';
import { BorderSmallResponsive } from '../shared/Styles';
import { mergeRefs } from '../../libs/common';

export const InputBlock = styled.div<{
    focus: boolean;
    valid: boolean;
    isSuccess?: boolean;
    scanner?: boolean;
    clearButton?: boolean;
    size?: 'small' | 'medium';
}>`
    width: 100%;
    ${p =>
        p.size === 'small'
            ? css`
                  min-height: 36px;
                  padding: 0 0.75rem;
              `
            : css`
                  min-height: 64px;
                  padding: 0 1rem;
              `}

    ${BorderSmallResponsive};
    display: flex;
    gap: 0.5rem;
    box-sizing: border-box;
    position: relative;
    transition: border-color 0.15s ease-in-out;

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
        ${p =>
            p.size === 'small'
                ? css`
                      display: none;
                  `
                : p.theme.displayType === 'full-width'
                ? css`
                      transform: translate(0, 10px) scale(0.7);
                  `
                : css`
                      transform: translate(0, 12px) scale(0.7);
                  `}
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

    ${props =>
        props.size !== 'small' &&
        props.theme.displayType === 'full-width' &&
        css`
            min-height: 52px;
        `}
`;

export const InputField = styled.input<{ marginRight?: string; size?: 'small' | 'medium' }>`
    outline: none;
    border: none;
    background: transparent;
    flex-grow: 1;
    font-weight: 500;
    font-size: 16px;
    padding: 30px 0 10px;
    box-sizing: border-box;

    ${p =>
        p.size === 'small'
            ? css`
                  padding: 8px 0;
              `
            : css`
                  padding: 30px 0 10px;
              `}

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
        props.theme.displayType === 'full-width' &&
        css`
            transform: translate(0, 18px) scale(1);
        `}

    ${props =>
        props.active &&
        (props.theme.displayType === 'full-width'
            ? css`
                  transform: translate(0, 10px) scale(0.7);
              `
            : css`
                  transform: translate(0, 12px) scale(0.7);
              `)}
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

    transition: color 0.15s ease-in-out;

    &:hover {
        color: ${props => props.theme.textTertiary};
    }
`;

export type InputProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'autoFocus' | 'onChange' | 'size'
> & {
    value: string;
    onChange?: (value: string) => void;
    onFocusChange?: (isFocused: boolean) => void;
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
    className?: string;
    size?: 'small' | 'medium';
    id: string;
    autoFocus?: number | boolean | 'notification';
    autoSelect?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            id,
            value,
            onChange,
            onFocusChange,
            isValid = true,
            isSuccess = false,
            label,
            disabled,
            helpText,
            tabIndex,
            clearButton,
            rightElement,
            marginRight,
            className,
            size,
            autoFocus,
            autoSelect,
            ...rest
        },
        ref
    ) => {
        const [focus, _setFocus] = useState(false);
        const focused = useRef(false);
        const setFocus = (v: boolean) => {
            _setFocus(v);
            onFocusChange?.(v);
        };

        const onClear: React.MouseEventHandler<HTMLDivElement> = e => {
            e.stopPropagation();
            e.preventDefault();
            if (disabled) return;
            onChange?.('');
        };

        const el = useRef<HTMLInputElement>(null);

        useEffect(() => {
            if (el.current && !focused.current && autoFocus) {
                setTimeout(
                    () => {
                        el.current?.focus();
                        if (autoSelect) {
                            setTimeout(() => {
                                el.current?.select();
                            }, 0);
                        }
                    },
                    typeof autoFocus === 'number'
                        ? autoFocus
                        : autoFocus === 'notification'
                        ? 400
                        : 30
                );
                focused.current = true;
            }
        }, [autoFocus, autoSelect]);

        return (
            <OuterBlock className={className}>
                <InputBlock
                    focus={focus}
                    valid={isValid}
                    isSuccess={isSuccess}
                    clearButton={clearButton}
                    size={size}
                >
                    <InputField
                        {...rest}
                        id={id}
                        ref={mergeRefs(ref, el)}
                        disabled={disabled}
                        value={value}
                        spellCheck={false}
                        autoCorrect="off"
                        autoComplete="off"
                        tabIndex={tabIndex}
                        marginRight={marginRight}
                        onChange={e => onChange && onChange(e.target.value)}
                        onFocus={() => setFocus(true)}
                        onBlur={() => setFocus(false)}
                        size={size}
                        placeholder={size === 'small' ? label : undefined}
                        autoFocus={!!autoFocus}
                    />
                    {label && size !== 'small' && (
                        <Label active={value !== ''} htmlFor={id}>
                            {label}
                        </Label>
                    )}
                    {rightElement && <RightBlock>{rightElement}</RightBlock>}
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
