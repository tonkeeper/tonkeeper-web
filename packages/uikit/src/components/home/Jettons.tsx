import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { AccountRepr, JettonBalance, JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { TonendpointStock } from '@tonkeeper/core/dist/tonkeeperApi/stock';
import { TronBalances } from '@tonkeeper/core/dist/tronApi';
import {
    formatDecimals,
    getJettonStockAmount,
    getJettonStockPrice,
    getTonCoinStockPrice
} from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import React, { FC, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { formatFiatCurrency, useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { AppRoute } from '../../libs/routes';
import { ToncoinIcon } from '../Icon';
import { ListBlock, ListItem } from '../List';
import { ListItemPayload, TokenLayout, TokenLogo } from './TokenLayout';
import { TronAssets } from './TronAssets';

export interface TonAssetData {
    info: AccountRepr;
    jettons: JettonsBalances;
}

export interface AssetData {
    stock: TonendpointStock;
    ton: TonAssetData;
    tron: TronBalances;
}

export interface AssetProps {
    assets: AssetData;
}

const DeltaColor = styled.span<{ positive: boolean }>`
  margin-left: 0.5rem;
  opacity: 0.64;

  ${props =>
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
        const today = new BigNumber(stock.today[FiatCurrencies.USD]).div(stock.today.TON);
        const yesterday = new BigNumber(stock.yesterday[FiatCurrencies.USD]).div(
            stock.yesterday.TON
        );

        const _delta = today.minus(yesterday);

        const value = _delta.div(yesterday).multipliedBy(100).toFixed(2);
        const _positive = parseFloat(value) >= 0;
        return [_positive, _positive ? `+${value}` : value] as const;
    }, [stock]);

    return <DeltaColor positive={positive}>{delta}%</DeltaColor>;
};

const TonAsset: FC<{
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
            formatFiatCurrency(fiat, formatDecimals(price.multipliedBy(info.balance)))
        ] as const;
    }, [fiat, price, info.balance]);

    return (
        <ListItem onClick={() => navigate(AppRoute.coins + '/ton')}>
            <ListItemPayload>
                <ToncoinIcon />
                <TokenLayout
                    name={t('Toncoin')}
                    symbol={CryptoCurrency.TON}
                    balance={balance}
                    secondary={
                        <>
                            {fiatPrice} <Delta stock={stock} />
                        </>
                    }
                    fiatAmount={fiatAmount}
                />
            </ListItemPayload>
        </ListItem>
    );
};

const JettonAsset: FC<{
    jetton: JettonBalance;
    stock: TonendpointStock;
}> = ({ jetton, stock }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { fiat } = useAppContext();

    const [price, total] = useMemo(() => {
        if (!stock || !jetton) return [undefined, undefined] as const;
        const _price = getJettonStockPrice(jetton, stock.today, fiat);
        if (_price === null) return [undefined, undefined] as const;
        const amount = getJettonStockAmount(jetton, _price);
        return [
            formatFiatCurrency(fiat, _price),
            amount ? formatFiatCurrency(fiat, amount) : undefined
        ];
    }, [jetton, stock, fiat]);

    const format = useFormatCoinValue();
    const formattedBalance = format(jetton.balance, jetton.metadata?.decimals);

    return (
        <ListItem
            onClick={() =>
                navigate(AppRoute.coins + `/${encodeURIComponent(jetton.jettonAddress)}`)
            }
        >
            <ListItemPayload>
                <TokenLogo src={jetton.metadata?.image} />
                <TokenLayout
                    name={jetton.metadata?.name ?? t('Unknown_COIN')}
                    symbol={jetton.metadata?.symbol}
                    balance={formattedBalance}
                    secondary={price}
                    fiatAmount={total}
                />
            </ListItemPayload>
        </ListItem>
    );
};

export const JettonList: FC<AssetProps> = ({
    assets: {
        stock,
        ton: { info, jettons },
        tron
    }
}) => {
    return (
        <>
            <ListBlock noUserSelect>
                <TonAsset info={info} stock={stock} />
                <TronAssets tokens={tron} stock={stock} />
            </ListBlock>
            <ListBlock noUserSelect>
                {jettons.balances.map(jetton => (
                    <JettonAsset key={jetton.jettonAddress} jetton={jetton} stock={stock} />
                ))}
            </ListBlock>
        </>
    );
};
