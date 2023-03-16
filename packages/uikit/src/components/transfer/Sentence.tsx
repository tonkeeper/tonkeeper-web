import React, { useRef } from 'react';
import styled from 'styled-components';

const SentenceInput = styled.input`
  padding: 0;
  margin: 0;
  border: none;
  outline: none;
  /* added styles */
  font-family: inherit;
  font-size: inherit;
  background: transparent;
  color: ${(props) => props.theme.textPrimary};

  font-family: 'Montserrat';
  font-style: normal;
  font-weight: 600;

  line-height: 49px;
  text-align: right;

  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
`;

export interface InputSize {
  size: number;
  width: number;
}

interface InputProps {
  value: string;
  setValue: (value: string) => void;
  inputSize: InputSize;
}

export const Sentence = React.forwardRef<HTMLInputElement, InputProps>(
  ({ value, setValue, inputSize }, ref) => {
    const lastValidValue = useRef<string>(value);

    return (
      <SentenceInput
        ref={ref}
        style={{
          fontSize: `${inputSize.size}px`,
          width: `${inputSize.width}px`,
        }}
        type="number"
        value={value}
        onKeyUp={(e) => {
          const input = ref as React.MutableRefObject<HTMLInputElement | null>;
          if (e.nativeEvent.key === '.') return;
          if (input.current) {
            if (input.current.validity.badInput) {
              setValue(lastValidValue.current);
            } else {
              lastValidValue.current = value;
            }
          }
        }}
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />
    );
  }
);
