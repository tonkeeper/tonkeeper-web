import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import {
  AccountRepr,
  JettonBalance,
  JettonsBalances,
} from '@tonkeeper/core/dist/tonApi';
import { TonendpointStock } from '@tonkeeper/core/dist/tonkeeperApi/stock';
import BigNumber from 'bignumber.js';
import React, { FC, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import {
  formatDecimals,
  formatFiatCurrency,
  getJettonStockAmount,
  getJettonStockPrice,
  getTonCoinStockPrice,
  useFormatCoinValue,
} from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { ToncoinIcon } from '../Icon';
import { ListBlock, ListItem } from '../List';
import { Body2, Label1, Label2 } from '../Text';

export interface AssetProps {
  stock: TonendpointStock;
  info: AccountRepr;
  jettons: JettonsBalances;
}

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

const DeltaColor = styled.span<{ positive: boolean }>`
  margin-left: 0.5rem;
  opacity: 0.64;

  ${(props) =>
    props.positive
      ? css`
          color: ${props.theme.accentGreen};
        `
      : css`
          color: ${props.theme.accentRed};
        `}}
`;

export const Delta: FC<{ stock: TonendpointStock }> = ({ stock }) => {
  const [positive, delta] = useMemo(() => {
    const today = new BigNumber(stock.today[FiatCurrencies.USD]).div(
      stock.today['TON']
    );
    const yesterday = new BigNumber(stock.yesterday[FiatCurrencies.USD]).div(
      stock.yesterday['TON']
    );

    const delta = today.minus(yesterday);

    const value = delta.div(yesterday).multipliedBy(100).toFixed(2);
    const positive = parseFloat(value) >= 0;
    return [positive, positive ? `+${value}` : value] as const;
  }, [stock]);

  return <DeltaColor positive={positive}>{delta}%</DeltaColor>;
};

export const TonAsset: FC<{
  info: AccountRepr;
  stock: TonendpointStock;
}> = ({ info, stock }) => {
  const { t } = useTranslation();
  const { fiat } = useAppContext();
  const navigate = useNavigate();
  const price = useMemo(() => {
    return getTonCoinStockPrice(stock.today, fiat);
  }, [stock]);

  const format = useFormatCoinValue();
  const balance = format(info.balance);

  const [fiatPrice, fiatAmount] = useMemo(() => {
    return [
      formatFiatCurrency(fiat, price),
      formatFiatCurrency(
        fiat,
        formatDecimals(price.multipliedBy(info.balance))
      ),
    ] as const;
  }, [fiat, price, info.balance]);

  return (
    <ListItem onClick={() => navigate(AppRoute.coins + '/ton')}>
      <ListItemPayload>
        <ToncoinIcon />
        <Description>
          <FirstLine>
            <Label1>{t('Toncoin')}</Label1>
            <Symbol>TON</Symbol>
            <Label1>{balance}</Label1>
          </FirstLine>
          <SecondLine>
            <Secondary>
              {fiatPrice} <Delta stock={stock} />
            </Secondary>
            <Secondary>{fiatAmount}</Secondary>
          </SecondLine>
        </Description>
      </ListItemPayload>
    </ListItem>
  );
};

const Logo = styled.img`
  width: 44px;
  height: 44px;
  border-radius: ${(props) => props.theme.cornerFull};

  pointer-events: none;
`;

const ListItemPayload = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 1rem 0;
  box-sizing: border-box;
  gap: 1rem;
  width: 100%;
`;

export const JettonAsset: FC<{
  jetton: JettonBalance;
  stock: TonendpointStock;
}> = ({ jetton, stock }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { fiat } = useAppContext();

  const [price, total] = useMemo(() => {
    if (!stock || !jetton) return [undefined, undefined] as const;
    const price = getJettonStockPrice(jetton, stock.today, fiat);
    if (price === null) return [undefined, undefined] as const;
    const amount = getJettonStockAmount(jetton, price);
    return [
      formatFiatCurrency(fiat, price),
      amount ? formatFiatCurrency(fiat, amount) : undefined,
    ];
  }, [jetton, stock, fiat]);

  const format = useFormatCoinValue();
  const formattedBalance = format(jetton.balance, jetton.metadata?.decimals);

  return (
    <ListItem
      onClick={() =>
        navigate(
          AppRoute.coins + `/${encodeURIComponent(jetton.jettonAddress)}`
        )
      }
    >
      <ListItemPayload>
        <Logo src={jetton.metadata?.image} />

        <Description>
          <FirstLine>
            <CoinName>{jetton.metadata?.name ?? t('Unknown_COIN')}</CoinName>
            <Symbol>{jetton.metadata?.symbol}</Symbol>
            <Label1>{formattedBalance}</Label1>
          </FirstLine>
          <SecondLine>
            <Secondary>{price}</Secondary>
            <Secondary>{total}</Secondary>
          </SecondLine>
        </Description>
      </ListItemPayload>
    </ListItem>
  );
};

const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: -1rem;
  margin-bottom: 1rem;
`;

const EditButton = styled(Label2)`
  padding: 0.5rem 1rem;
  box-sizing: border-box;
  cursor: pointer;
  border-radius: ${(props) => props.theme.cornerMedium};
  color: ${(props) => props.theme.textPrimary};
  background: ${(props) => props.theme.backgroundContent};
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    background: ${(props) => props.theme.backgroundContentTint};
  }
`;

export const JettonList: FC<AssetProps> = ({ info, jettons, stock }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      <ListBlock>
        <TonAsset info={info} stock={stock} />
        {jettons.balances.map((jetton) => (
          <JettonAsset
            key={jetton.jettonAddress}
            jetton={jetton}
            stock={stock}
          />
        ))}
      </ListBlock>
      {jettons.balances.length > 0 && (
        <ButtonRow>
          <EditButton
            onClick={() => navigate(AppRoute.settings + SettingsRoute.jettons)}
          >
            {t('Edit_jettons')}
          </EditButton>
        </ButtonRow>
      )}
    </>
  );
};
