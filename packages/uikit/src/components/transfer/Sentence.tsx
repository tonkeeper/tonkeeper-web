import React from 'react';
import styled, { css } from 'styled-components';

const SentenceInput = styled.input<{ small?: boolean }>`
  padding: 0;
  margin: 0;
  border: none;
  outline: none;
  /* added styles */
  font-family: inherit;
  font-size: inherit;
  position: absolute;
  vertical-align: top;
  top: 0;
  left: 0;
  width: 100%;
  background: transparent;
  color: ${(props) => props.theme.textPrimary};

  font-family: 'Montserrat';
  font-style: normal;
  font-weight: 600;
  ${(props) =>
    props.small
      ? css`
          font-size: 22px;
        `
      : css`
          font-size: 40px;
        `}

  // @media (max-width: 600px) {
  //   font-size: 22px;
  // }
  // @media (max-width: 400px) {
  //   font-size: 18px;
  // }

  line-height: 49px;

  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
`;

const Label = styled.label`
  display: inline-block;
  position: relative;
  min-width: 2em;
  min-height: 1.4em;
`;

const Template = styled.span<{ small?: boolean }>`
  font-family: 'Montserrat';
  font-style: normal;
  font-weight: 600;

  color: ${(props) => props.theme.backgroundContent};

  ${(props) =>
    props.small
      ? css`
          font-size: 22px;
        `
      : css`
          font-size: 40px;
        `}

  // @media (max-width: 600px) {
  //   font-size: 22px;
  // }
  // @media (max-width: 400px) {
  //   font-size: 18px;
  // }

  line-height: 49px;

  white-space: pre;
  /* max-width : could be wised to set a maximum width and overflow:hidden; */
`;

interface InputProps {
  value: string;
  setValue: (value: string) => void;
}

export const Sentence = React.forwardRef<HTMLInputElement, InputProps>(
  ({ value, setValue }, ref) => {
    const small = value.length > 18;
    return (
      <Label>
        <Template small={small}>{value ? value : ' '}</Template>
        <SentenceInput
          ref={ref}
          small={small}
          type="number"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
        />
      </Label>
    );
  }
);
