import React, { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { ScanIcon } from '../Icon';

const InputBlock = styled.div<{
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
    transform: translate(0, 6px) scale(0.7);
    color: ${(props) => props.theme.fieldActiveBorder};
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

const InputField = styled.input`
  outline: none;
  border: none;
  background: transparent;
  flex-grow: 1;
  font-weight: 500;
  font-size: 16px;
  padding: 8px 0 0;
  line-height: 46px;

  color: ${(props) => props.theme.textPrimary};
`;

const Label = styled.label<{ active?: boolean }>`
  user-select: none;

  position: absolute;
  pointer-events: none;
  transform: translate(0, 20px) scale(1);
  transform-origin: top left;
  transition: 200ms cubic-bezier(0, 0, 0.2, 1) 0ms;
  color: ${(props) => props.theme.textPrimary};
  font-size: 16px;
  line-height: 1;
  left: 1rem;

  ${(props) =>
    props.active &&
    css`
      transform: translate(0, 6px) scale(0.7);
    `}
`;

interface InputProps {
  type?: 'password' | undefined;
  value: string;
  onChange?: (value: string) => void;
  isValid?: boolean;
  label?: string;
  disabled?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, value, onChange, isValid = true, label, disabled }, ref) => {
    const [focus, setFocus] = useState(false);

    return (
      <InputBlock focus={focus} valid={isValid}>
        <InputField
          ref={ref}
          disabled={disabled}
          type={type}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
        {label && <Label active={value != ''}>{label}</Label>}
      </InputBlock>
    );
  }
);

export interface InputWithScanner {
  value: string;
  onScan: (signature: string) => void;
  onChange?: (value: string) => void;
  isValid?: boolean;
  label?: string;
  disabled?: boolean;
}

const ScanBlock = styled.div<{ ios: boolean }>`
  position: absolute;
  right: 1rem;
  top: 0;
  height: ${(props) => (props.ios ? '56px' : '54px')};
  align-items: center;
  display: flex;

  color: ${(props) => props.theme.accentBlue};
`;

export const InputWithScanner = React.forwardRef<
  HTMLInputElement,
  InputWithScanner
>(({ value, onChange, isValid = true, label, disabled, onScan }, ref) => {
  const [focus, setFocus] = useState(false);
  const [scanId, setScanId] = useState<number | undefined>(undefined);
  const sdk = useAppSdk();
  const { ios } = useAppContext();

  const onClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;
    const id = Date.now();
    sdk.uiEvents.emit('scan', {
      method: 'scan',
      id: id,
      params: undefined,
    });
    setScanId(id);
  };

  useEffect(() => {
    const handler = (options: {
      method: 'response';
      id?: number | undefined;
      params: string;
    }) => {
      if (options.id === scanId) {
        onScan(options.params);
      }
    };
    sdk.uiEvents.on('response', handler);

    return () => {
      sdk.uiEvents.off('response', handler);
    };
  }, [sdk, scanId, onScan]);

  return (
    <InputBlock focus={focus} valid={isValid} scanner>
      <InputField
        ref={ref}
        disabled={disabled}
        type="text"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
      {label && <Label active={value != ''}>{label}</Label>}

      <ScanBlock ios={ios} onClick={onClick}>
        <ScanIcon />
      </ScanBlock>
    </InputBlock>
  );
});
