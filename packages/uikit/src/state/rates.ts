import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { RatesApi } from '@tonkeeper/core/dist/tonApiV2';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useAppContext } from '../hooks/appContext';
import { formatFiatCurrency } from '../hooks/balance';
import { QueryKey } from '../libs/queryKey';

interface RateByCurrency {
    diff_7d: { [key: string]: string };
    diff_24h: { [key: string]: string };
    prices: { [key: string]: number };
}

export interface TokenRate {
    diff_7d: string;
    diff_24h: string;
    prices: number;
}

const toTokenRate = (rate: RateByCurrency, fiat: FiatCurrencies): TokenRate => {
    return Object.entries(rate).reduce((acc, [key, value]) => {
        acc[key] = value[fiat];
        return acc;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as Record<string, any>) as TokenRate;
};

const popularJettons = [
    'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA', // jUSDT
    'EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728', // jUSDC
    'EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728' // jWBTC
];

export const usePreFetchRates = () => {
    const { tonApiV2 } = useAppContext();
    const { fiat } = useAppContext();
    const client = useQueryClient();

    return useQuery(
        [QueryKey.rate],
        async () => {
            const value = await new RatesApi(tonApiV2).getRates({
                tokens: [CryptoCurrency.TON, CryptoCurrency.USDT, ...popularJettons].join(','),
                currencies: fiat
            });

            if (!value || !value.rates) {
                throw new Error('Missing price for tokens');
            }

            for (const [token, rate] of Object.entries<RateByCurrency>(value.rates)) {
                try {
                    const tokenRate = toTokenRate(rate, fiat);
                    if (tokenRate) {
                        client.setQueryData([QueryKey.rate, fiat, token], tokenRate);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            return 'ok';
        },
        { retry: 0 }
    );
};

export const useRate = (token: string) => {
    const { tonApiV2 } = useAppContext();
    const { fiat } = useAppContext();
    return useQuery<TokenRate, Error>(
        [QueryKey.rate, fiat, token],
        async () => {
            const value = await new RatesApi(tonApiV2).getRates({
                tokens: token,
                currencies: fiat
            });

            try {
                const tokenRate = toTokenRate(value.rates[token], fiat);
                if (!tokenRate || !tokenRate.prices) {
                    throw new Error(`Missing price for token: ${token}`);
                }
                return tokenRate;
            } catch (e) {
                throw e;
            }
        },
        { retry: 0 }
    );
};

export const useFormatFiat = (rate: TokenRate | undefined, tokenAmount: BigNumber.Value) => {
    const { fiat } = useAppContext();

    const [fiatPrice, fiatAmount] = useMemo(() => {
        if (!rate || !rate.prices) return [undefined, undefined] as const;
        return [
            formatFiatCurrency(fiat, rate.prices),
            formatFiatCurrency(fiat, new BigNumber(rate.prices).multipliedBy(tokenAmount))
        ] as const;
    }, [rate, fiat, tokenAmount]);
    return {
        fiatPrice,
        fiatAmount
    };
};
