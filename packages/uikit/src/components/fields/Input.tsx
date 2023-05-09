import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { Body2 } from '../Text';
import { TextareaAutosize } from './TextareaAutosize';

export const InputBlock = styled.div<{
  focus: boolean;
  valid: boolean;
  scanner?: boolean;
}>`
  width: 100%;
  line-height: 56px;
  border-radius: ${(props) => props.theme.cornerSmall};
  display: flex;
  padding: 0 1rem;
  gap: 0.5rem;
  box-sizing: border-box;
  position: relative;

  ${(props) =>
    props.scanner &&
    css`
      padding-right: 3.5rem;
    `}

  &:focus-within label {
    transform: translate(0, 12px) scale(0.7);
  }

  ${(props) =>
    !props.valid
      ? css`
          border: 1px solid ${props.theme.fieldErrorBorder};
          background: ${props.theme.fieldErrorBackground};

          &:focus-within label {
            color: ${(props) => props.theme.fieldErrorBorder};
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
`;

export const InputField = styled.input`
  outline: none;
  border: none;
  background: transparent;
  flex-grow: 1;
  font-weight: 500;
  font-size: 16px;
  padding: 30px 0 12px;

  color: ${(props) => props.theme.textPrimary};
`;

export const Label = styled.label<{ active?: boolean }>`
  user-select: none;

  position: absolute;
  pointer-events: none;
  transform: translate(0, 23px) scale(1);
  transform-origin: top left;
  transition: 200ms cubic-bezier(0, 0, 0.2, 1) 0ms;
  color: ${(props) => props.theme.textSecondary};
  font-size: 16px;
  line-height: 1;
  left: 1rem;

  ${(props) =>
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

  ${(props) =>
    props.valid
      ? css`
          color: ${(props) => props.theme.textSecondary};
        `
      : css`
          color: ${(props) => props.theme.fieldErrorBorder};
        `}
`;

export interface InputProps {
  type?: 'password' | undefined;
  value: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  isValid?: boolean;
  label?: string;
  disabled?: boolean;
  helpText?: string;
  tabIndex?: number;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type,
      value,
      onChange,
      isValid = true,
      label,
      disabled,
      helpText,
      tabIndex,
    },
    ref
  ) => {
    const [focus, setFocus] = useState(false);

    return (
      <OuterBlock>
        <InputBlock focus={focus} valid={isValid}>
          <InputField
            ref={ref}
            disabled={disabled}
            type={type}
            value={value}
            spellCheck={false}
            tabIndex={tabIndex}
            onChange={(e) => onChange && onChange(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
          />
          {label && <Label active={value != ''}>{label}</Label>}
        </InputBlock>
        {helpText && <HelpText valid={isValid}>{helpText}</HelpText>}
      </OuterBlock>
    );
  }
);

export const TextArea = React.forwardRef<HTMLTextAreaElement, InputProps>(
  (
    { value, onChange, isValid = true, label, disabled, helpText, onSubmit },
    ref
  ) => {
    const [focus, setFocus] = useState(false);

    return (
      <OuterBlock>
        <InputBlock focus={focus} valid={isValid}>
          <TextareaAutosize
            onSubmit={onSubmit}
            ref={ref}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
          />
          {label && <Label active={value != ''}>{label}</Label>}
        </InputBlock>
        {helpText && <HelpText valid={isValid}>{helpText}</HelpText>}
      </OuterBlock>
    );
  }
);
