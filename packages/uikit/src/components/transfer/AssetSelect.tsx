import { AccountRepr, JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { getJettonSymbol, TONAsset } from '@tonkeeper/core/dist/utils/send';
import React, { FC } from 'react';
import styled from 'styled-components';
import { useFormatCoinValue } from '../../hooks/balance';
import { DropDown } from '../DropDown';
import { DoneIcon, DownIcon } from '../Icon';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { Body1, Label1 } from '../Text';

const AssetValue = styled.div`
  background: ${(props) => props.theme.buttonTertiaryBackground};
  border-radius: ${(props) => props.theme.cornerSmall};
  padding: 0.5rem 1rem;
  display: flex;
  gap: 0.5rem;
`;

const DownIconWrapper = styled.span`
  color: ${(props) => props.theme.iconSecondary};
  display: flex;
  align-items: center;
`;

const AssetImage = styled.img`
  border-radius: ${(props) => props.theme.cornerFull};
  width: 24px;
  height: 24px;
`;

const AssetInfo = styled.div`
  display: flex;
  gap: 0.5rem;
  width: 200px;
  overflow: hidden;
`;

const Amount = styled(Body1)`
  color: ${(props) => props.theme.textSecondary};
  text-overflow: ellipsis;
  overflow: hidden;
`;

const Icon = styled.span`
  padding-left: 0.5rem;
  color: ${(props) => props.theme.accentBlue};
  display: flex;
`;

const AssetDropDown: FC<{
  info?: AccountRepr;
  onClose: () => void;
  jetton: string;
  jettons: JettonsBalances;
  setJetton: (value: string) => void;
}> = ({ onClose, jetton, jettons, setJetton, info }) => {
  const format = useFormatCoinValue();
  return (
    <ListBlock margin={false} dropDown>
      <ListItem
        dropDown
        onClick={() => {
          setJetton(TONAsset);
          onClose();
        }}
      >
        <ListItemPayload>
          <AssetInfo>
            <AssetImage src="/img/toncoin.svg"></AssetImage>
            <Label1>{TONAsset}</Label1>
            <Amount>{format(info?.balance ?? 0)}</Amount>
          </AssetInfo>
          {TONAsset === jetton ? (
            <Icon>
              <DoneIcon />
            </Icon>
          ) : undefined}
        </ListItemPayload>
      </ListItem>
      {jettons.balances.map((item) => {
        return (
          <ListItem
            dropDown
            key={item.jettonAddress}
            onClick={() => {
              setJetton(item.jettonAddress);
              onClose();
            }}
          >
            <ListItemPayload>
              <AssetInfo>
                <AssetImage src={item.metadata?.image}></AssetImage>
                <Label1>{item.metadata?.symbol}</Label1>
                <Amount>{format(item.balance, item.metadata?.decimals)}</Amount>
              </AssetInfo>

              {item.jettonAddress === jetton ? (
                <Icon>
                  <DoneIcon />
                </Icon>
              ) : undefined}
            </ListItemPayload>
          </ListItem>
        );
      })}
    </ListBlock>
  );
};

export const AssetSelect: FC<{
  info?: AccountRepr;
  jetton: string;
  jettons: JettonsBalances;
  setJetton: (value: string) => void;
}> = ({ jetton, jettons, setJetton, info }) => {
  return (
    <DropDown
      center
      payload={(onClose) => (
        <AssetDropDown
          info={info}
          onClose={onClose}
          jetton={jetton}
          jettons={jettons}
          setJetton={setJetton}
        />
      )}
    >
      <AssetValue>
        <Label1>{getJettonSymbol(jetton, jettons)}</Label1>
        <DownIconWrapper>
          <DownIcon />
        </DownIconWrapper>
      </AssetValue>
    </DropDown>
  );
};
