import React, { FC } from 'react';
import styled from 'styled-components';
import { Body2, Label1 } from '../Text';

export const ListItemPayload = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 1rem 0;
  box-sizing: border-box;
  gap: 1rem;
  width: 100%;
`;

const Description = styled.div`
  flex-grow: 1;

  display: flex;
  flex-direction: column;

  white-space: nowrap;
`;

const FirstLine = styled.div`
  display: grid;
  grid-template-columns: auto 1fr 0fr;
  gap: 0.25rem;
  width: 100%;
`;

const CoinName = styled(Label1)`
  text-overflow: ellipsis;
  overflow: hidden;
`;

const SecondLine = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Secondary = styled(Body2)`
  color: ${(props) => props.theme.textSecondary};
`;

const Symbol = styled(Label1)`
  color: ${(props) => props.theme.textSecondary};
`;

export const TokenLayout: FC<{
  name: string;
  symbol?: string;
  balance: string;
  secondary: React.ReactNode;
  fiatAmount?: string;
}> = ({ name, symbol, balance, secondary, fiatAmount }) => {
  return (
    <Description>
      <FirstLine>
        <CoinName>{name}</CoinName>
        <Symbol>{symbol}</Symbol>
        <Label1>{balance}</Label1>
      </FirstLine>
      <SecondLine>
        <Secondary>{secondary}</Secondary>
        <Secondary>{fiatAmount}</Secondary>
      </SecondLine>
    </Description>
  );
};
