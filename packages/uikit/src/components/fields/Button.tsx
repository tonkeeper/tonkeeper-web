import React, { FC, PropsWithChildren } from 'react';
import styled, { css } from 'styled-components';
import { SpinnerIcon } from '../Icon';

export interface ButtonProps {
  loading?: boolean;

  size?: 'small' | 'medium' | 'large';
  primary?: boolean;
  secondary?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  bottom?: boolean;
  marginTop?: boolean;

  type?: 'button' | 'submit' | 'reset' | undefined;
}

export const ButtonElement = styled.button<Omit<ButtonProps, 'loading'>>`
  border: 0;
  outline: 0;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;

  font-family: 'Montserrat';
  font-style: normal;
  font-weight: 600;

  ${(props) =>
    !props.disabled
      ? css`
          cursor: pointer;
        `
      : undefined}

  flex-shrink: 0;

  ${(props) =>
    props.bottom
      ? css`
          margin-bottom: 1rem;
        `
      : undefined}

  ${(props) =>
    props.marginTop
      ? css`
          margin-top: 1rem;
        `
      : undefined}

  ${(props) =>
    props.fullWidth
      ? css`
          width: 100%;
        `
      : css`
          width: auth;
        `}

  ${(props) => {
    switch (props.size) {
      case 'large':
        return css`
          height: 56px;
          padding: 0px 24px;
        `;
      case 'small':
        return css`
          height: 36px;
          padding: 0px 16px;
        `;
      default:
        return css`
          height: 48px;
          padding: 0px 20px;
        `;
    }
  }}

  ${(props) => {
    switch (props.size) {
      case 'small':
        return css`
          font-size: 14px;
          line-height: 20px;
        `;
      default:
        return css`
          font-size: 16px;
          line-height: 24px;
        `;
    }
  }}

  ${(props) => {
    switch (props.size) {
      case 'large':
        return css`
          border-radius: ${props.theme.cornerSmall};
        `;
      default:
        return css`
          border-radius: ${props.theme.cornerLarge};
        `;
    }
  }}
  &:hover {
    ${(props) => {
      if (props.disabled) return;
      if (props.primary) {
        return css`
          background: ${props.theme.buttonPrimaryBackgroundHighlighted};
        `;
      } else if (props.secondary) {
        return css`
          background: ${props.theme.buttonSecondaryBackgroundHighlighted};
        `;
      } else {
        return css`
          background: ${props.theme.buttonTertiaryBackgroundHighlighted};
        `;
      }
    }}
  }

  ${(props) => {
    if (props.primary) {
      if (props.disabled) {
        return css`
          color: ${props.theme.buttonPrimaryForegroundDisabled};
          background: ${props.theme.buttonPrimaryBackgroundDisabled};
        `;
      } else {
        return css`
          color: ${props.theme.buttonPrimaryForeground};
          background: ${props.theme.buttonPrimaryBackground};
        `;
      }
    } else if (props.secondary) {
      if (props.disabled) {
        return css`
          color: ${props.theme.buttonSecondaryForegroundDisabled};
          background: ${props.theme.buttonSecondaryBackgroundDisabled};
        `;
      } else {
        return css`
          color: ${props.theme.buttonSecondaryForeground};
          background: ${props.theme.buttonSecondaryBackground};
        `;
      }
    } else {
      if (props.disabled) {
        return css`
          color: ${props.theme.buttonTertiaryForegroundDisabled};
          background: ${props.theme.buttonTertiaryBackgroundDisabled};
        `;
      } else {
        return css`
          color: ${props.theme.buttonTertiaryForeground};
          background: ${props.theme.buttonTertiaryBackground};
        `;
      }
    }
  }}
`;

export const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;

  ${ButtonElement} {
    flex: 1;
  }
`;

export const Button: FC<
  PropsWithChildren<
    ButtonProps &
      Omit<
        React.HTMLProps<HTMLButtonElement>,
        'size' | 'children' | 'ref' | 'as'
      >
  >
> = ({ children, loading, ...props }) => {
  if (loading) {
    return (
      <ButtonElement {...props} disabled>
        <SpinnerIcon />
      </ButtonElement>
    );
  } else {
    return <ButtonElement {...props}>{children}</ButtonElement>;
  }
};
