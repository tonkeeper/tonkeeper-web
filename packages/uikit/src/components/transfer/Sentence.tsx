import React from 'react';
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
    color: ${props => props.theme.textPrimary};

    font-family: 'Montserrat', sans-serif;
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
        return (
            <SentenceInput
                autoComplete="off"
                id="sentence"
                ref={ref}
                style={{
                    fontSize: `${inputSize.size}px`,
                    width: `${inputSize.width}px`
                }}
                inputMode="decimal"
                type="text"
                value={value}
                onChange={event => {
                    setValue(event.target.value);
                }}
            />
        );
    }
);
Sentence.displayName = 'Sentence';
