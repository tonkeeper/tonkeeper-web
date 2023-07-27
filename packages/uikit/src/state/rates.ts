import { useQuery } from '@tanstack/react-query';
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

export const useRate = (token: string) => {
    const { tonApiV2 } = useAppContext();
    const { fiat } = useAppContext();
    return useQuery<TokenRate, Error>([QueryKey.rate, token, fiat], async () => {
        const value = await new RatesApi(tonApiV2).getRates({
            tokens: token,
            currencies: fiat
        });

        const rate: RateByCurrency = value.rates[token];
        return Object.entries(rate).reduce((acc, [key, value]) => {
            acc[key] = value[fiat];
            return acc;
        }, {} as Record<string, any>) as TokenRate;
    });
};

export const useFormatFiat = (rate: TokenRate | undefined, tokenAmount: BigNumber.Value) => {
    const { fiat } = useAppContext();

    const [fiatPrice, fiatAmount] = useMemo(() => {
        if (!rate) return [undefined, undefined] as const;
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
