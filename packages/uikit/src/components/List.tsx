import React, { FC, PropsWithChildren } from 'react';
import styled, { css } from 'styled-components';
import { useAppContext } from '../hooks/appContext';

export const ListBlock = styled.div<{
  margin?: boolean;
  dropDown?: boolean;
  fullWidth?: boolean;
  noUserSelect?: boolean;
}>`
  display: flex;
  flex-direction: column;

  ${(props) =>
    props.dropDown
      ? css`
          background: ${(props) => props.theme.backgroundContentTint};
        `
      : css`
          background: ${(props) => props.theme.backgroundContent};
        `}

  padding: 0;

  ${(props) =>
    props.margin !== false
      ? css`
          margin: 0 0 2rem;
        `
      : undefined}

  ${(props) =>
    props.fullWidth
      ? css`
          width: 100%;
        `
      : undefined}

      ${(props) =>
    props.noUserSelect
      ? css`
          user-select: none;
        `
      : undefined}

  border-radius: ${(props) => props.theme.cornerSmall};

  > div:first-child {
    border-top-right-radius: ${(props) => props.theme.cornerSmall};
    border-top-left-radius: ${(props) => props.theme.cornerSmall};
  }
  > div:last-child {
    border-bottom-right-radius: ${(props) => props.theme.cornerSmall};
    border-bottom-left-radius: ${(props) => props.theme.cornerSmall};
  }
`;

export const ListItemPayload = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 1rem 0;
  box-sizing: border-box;

  width: 100%;
`;

const ListItemElement = styled.div<{
  hover?: boolean;
  dropDown?: boolean;
  ios: boolean;
}>`
  display: flex;
  padding: 0 0 0 1rem;

  ${(props) =>
    props.dropDown
      ? css`
          background: ${(props) => props.theme.backgroundContentTint};
        `
      : css`
          background: ${(props) => props.theme.backgroundContent};
        `}

  ${(props) => {
    if (props.dropDown) {
      return props.hover !== false
        ? css`
            cursor: pointer;
            &: ${props.ios ? 'active' : 'hover'} {
              background: ${props.theme.backgroundHighlighted};

              > div {
                border-top-color: ${props.theme
                  .backgroundHighlighted} !important;
              }
            }
          `
        : undefined;
    } else {
      return props.hover !== false
        ? css`
            cursor: pointer;
            &: ${props.ios ? 'active' : 'hover'} {
              background: ${props.theme.backgroundContentTint};

              > div {
                border-top-color: ${props.theme
                  .backgroundContentTint} !important;
              }
            }
          `
        : undefined;
    }
  }}

  & + & > div {
    border-top: 1px solid ${(props) => props.theme.separatorCommon};
    padding-top: 15px;
  }
`;

export const ListItem: FC<
  PropsWithChildren<
    { hover?: boolean; dropDown?: boolean } & Omit<
      React.HTMLProps<HTMLDivElement>,
      'size' | 'children' | 'as'
    >
  >
> = ({ children, hover, dropDown, ref, ...props }) => {
  const { ios } = useAppContext();
  return (
    <ListItemElement
      hover={hover}
      dropDown={dropDown}
      ios={ios}
      ref={ref as React.MutableRefObject<HTMLInputElement>}
      {...props}
    >
      {children}
    </ListItemElement>
  );
};
