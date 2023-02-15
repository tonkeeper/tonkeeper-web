import React, { FC } from 'react';
import styled, { css } from 'styled-components';
import { LogoutBlock, LogoutButton } from './create/Words';
import { Body2, H2, Label1 } from './Text';

export const Gap = styled.div`
  flex-grow: 1;
`;

const Block = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const TextBlock = styled.div`
  margin-bottom: 1rem;
`;

const Body = styled(Body2)`
  color: ${(props) => props.theme.textSecondary};
`;

export const IconPage: FC<{
  icon: React.ReactNode;
  title?: string;
  description?: string;
  button?: React.ReactNode;
  logOut?: boolean;
}> = ({ icon, title, description, button, logOut }) => {
  return (
    <>
      {logOut && (
        <LogoutBlock>
          <LogoutButton />
        </LogoutBlock>
      )}
      <Block>
        {icon}
        <TextBlock>
          {title && <H2>{title}</H2>}
          {description && <Body>{description}</Body>}
        </TextBlock>
        {button}
      </Block>
    </>
  );
};

const Text = styled.div<{ right?: boolean; noWrap?: boolean }>`
  display: flex;
  flex-direction: column;
  ${(props) =>
    props.right
      ? css`
          text-align: right;
        `
      : undefined}

  ${(props) =>
    props.noWrap
      ? css`
          flex-grow: 1;
          overflow: hidden;
        `
      : undefined}
`;

const Label = styled(Label1)<{ green?: boolean; noWrap?: boolean }>`
  ${(props) =>
    props.green
      ? css`
          color: ${props.theme.accentGreen};
        `
      : undefined}

  ${(props) =>
    props.noWrap
      ? css`
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        `
      : undefined}
`;

const Secondary = styled(Body2)<{ noWrap?: boolean }>`
  color: ${(props) => props.theme.textSecondary};
  ${(props) =>
    props.noWrap
      ? css`
          white-space: nowrap;
        `
      : undefined}
`;

export const ColumnText: FC<{
  green?: boolean;
  right?: boolean;
  noWrap?: boolean;
  text: React.ReactNode;
  secondary: React.ReactNode;
}> = ({ green, text, secondary, right, noWrap }) => {
  return (
    <Text right={right} noWrap={noWrap}>
      <Label green={green} noWrap={noWrap}>
        {text}
      </Label>
      <Secondary noWrap={noWrap}>{secondary}</Secondary>
    </Text>
  );
};

export const Divider = styled.div`
  height: 8px;
  width: 100%;
  background: ${(props) => props.theme.backgroundContent};
`;
