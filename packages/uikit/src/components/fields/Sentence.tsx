import React, { FC } from 'react';
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
  line-height: 49px;
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
  ${(props) =>
    props.small
      ? css`
          font-size: 22px;
        `
      : css`
          font-size: 40px;
        `}
  line-height: 49px;

  white-space: pre;
  /* max-width : could be wised to set a maximum width and overflow:hidden; */
`;

export const Sentence: FC<{
  value: string;
  setValue: (value: string) => void;
}> = ({ value, setValue }) => {
  const small = value.length > 18;
  return (
    <Label>
      <Template small={small}>{value ? value : ' '}</Template>
      <SentenceInput
        small={small}
        type="text"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />
    </Label>
  );
};
