import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import React, { FC, useEffect } from 'react';
import styled from 'styled-components';
import { Address } from 'ton-core';
import { useAppContext } from '../../hooks/appContext';
import { formatFiatCurrency } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { TokenRate, getRateKey } from '../../state/rates';
import { SkeletonText } from '../Skeleton';
import { Body3, Label2, Num2 } from '../Text';
import { AssetData } from './Jettons';

const Block = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 32px;
`;

const Body = styled(Label2)`
    color: ${props => props.theme.textSecondary};
    user-select: none;
`;

const Amount = styled(Num2)`
    margin-bottom: 0.5rem;
    user-select: none;
`;

const Error = styled.div`
    height: 26px;
    text-align: center;
    width: 100%;
`;

const Text = styled(Body3)`
    line-height: 26px;
    color: ${props => props.theme.textSecondary};
`;
const MessageBlock: FC<{ error?: Error | null; isFetching: boolean }> = ({ error }) => {
    if (error) {
        return (
            <Error>
                <Text>{error.message}</Text>
            </Error>
        );
    }

    return <Error></Error>;
};

export const BalanceSkeleton = () => {
    return (
        <Block>
            <Error></Error>
            <Amount>
                <SkeletonText size="large" width="120px" />
            </Amount>
            <Body>
                <SkeletonText size="small" width="60px" />
            </Body>
        </Block>
    );
};

const useRateOrDefault = (
    client: QueryClient,
    fiat: FiatCurrencies,
    token: string,
    useRate: (rate: TokenRate) => BigNumber,
    defaultValue: BigNumber
) => {
    const rate = client.getQueryCache().find(getRateKey(fiat, token))?.state.data as
        | TokenRate
        | undefined;

    if (rate) {
        return useRate(rate);
    } else {
        return defaultValue;
    }
};

const getTonFiatAmount = (client: QueryClient, fiat: FiatCurrencies, assets: AssetData) => {
    return useRateOrDefault(
        client,
        fiat,
        CryptoCurrency.TON,
        rate => shiftedDecimals(assets.ton.info.balance).multipliedBy(rate.prices),
        new BigNumber(0)
    );
};

const getTRC20FiatAmount = (client: QueryClient, fiat: FiatCurrencies, assets: AssetData) => {
    return assets.tron.balances.reduce(
        (total, { weiAmount, token }) =>
            useRateOrDefault(
                client,
                fiat,
                token.symbol,
                rate =>
                    total.plus(
                        shiftedDecimals(weiAmount, token.decimals).multipliedBy(rate.prices)
                    ),
                total
            ),
        new BigNumber(0)
    );
};

const getJettonsFiatAmount = (client: QueryClient, fiat: FiatCurrencies, assets: AssetData) => {
    return assets.ton.jettons.balances.reduce(
        (total, { jettonAddress, balance, metadata }) =>
            useRateOrDefault(
                client,
                fiat,
                Address.parse(jettonAddress).toString(),
                rate =>
                    total.plus(
                        shiftedDecimals(balance, metadata?.decimals).multipliedBy(rate.prices)
                    ),
                total
            ),
        new BigNumber(0)
    );
};

export const Balance: FC<{
    error?: Error | null;
    isFetching: boolean;
    assets: AssetData;
}> = ({ assets, error, isFetching }) => {
    const { t } = useTranslation();

    const { fiat } = useAppContext();

    const client = useQueryClient();

    const { data: total } = useQuery(
        [QueryKey.total, fiat, assets],
        () => {
            return getTonFiatAmount(client, fiat, assets)
                .plus(getTRC20FiatAmount(client, fiat, assets))
                .plus(getJettonsFiatAmount(client, fiat, assets));
        },
        { initialData: new BigNumber(0) }
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            if (total.toString() === '0') {
                client.invalidateQueries([QueryKey.total]);
            }
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [total]);

    return (
        <Block>
            <MessageBlock error={error} isFetching={isFetching} />
            <Amount>{formatFiatCurrency(fiat, total)}</Amount>
            <Body>{t('total_balance')}</Body>
        </Block>
    );
};
