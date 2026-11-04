import { useAppSdk } from '../hooks/appSdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import {
    FiatCurrencies,
    normalizeFiatCode,
    registerFiatSymbol
} from '@tonkeeper/core/dist/entries/fiat';
import type { Currency } from '@tonkeeper/core/dist/tonkeeperApiGenerated';
import { QueryKey } from '../libs/queryKey';
import { useAppContext } from '../hooks/appContext';

const supportedCurrenciesQueryKey = [QueryKey.allowedFiatCurrencies, 'detailed'];

interface StoredFiatSymbol {
    code: string;
    symbol: string;
}

const supportedCurrenciesStaleTime = 60 * 60 * 1000;

export const useSupportedCurrencies = () => {
    const { tonendpoint } = useAppContext();
    return useQuery<Currency[]>(
        supportedCurrenciesQueryKey,
        () => tonendpoint.supportedCurrencies(),
        { staleTime: supportedCurrenciesStaleTime }
    );
};

export const useAllowedFiatCurrencies = () => {
    const { tonendpoint } = useAppContext();
    return useQuery([QueryKey.allowedFiatCurrencies], async () => {
        const result = await tonendpoint.supportedCurrencies();
        return result.map(i => i.code);
    });
};

export const useUserFiatQuery = () => {
    const sdk = useAppSdk();
    return useQuery<FiatCurrencies>(
        [AppKey.FIAT],
        async () => {
            const [storedFiat, stored] = await Promise.all([
                sdk.storage.get<FiatCurrencies | undefined>(AppKey.FIAT),
                sdk.storage.get<StoredFiatSymbol>(AppKey.FIAT_SYMBOL)
            ]);
            const fiat = storedFiat ? normalizeFiatCode(storedFiat) : undefined;
            if (fiat && stored && normalizeFiatCode(stored.code) === fiat) {
                registerFiatSymbol(fiat, stored.symbol);
            }
            return fiat || FiatCurrencies.USD;
        },
        {
            keepPreviousData: true
        }
    );
};

export const useUserFiat = () => {
    const { data } = useUserFiatQuery();
    if (!data) {
        throw new Error('User fiat query is unexpectedly empty');
    }

    return data;
};

export const useMutateUserFiat = () => {
    const sdk = useAppSdk();
    const { tonendpoint } = useAppContext();
    const client = useQueryClient();
    return useMutation<void, Error, FiatCurrencies>(async fiat => {
        const currencies = await client
            .fetchQuery(supportedCurrenciesQueryKey, () => tonendpoint.supportedCurrencies(), {
                staleTime: supportedCurrenciesStaleTime
            })
            .catch(() => undefined);
        const symbol = currencies?.find(c => c.code.toUpperCase() === fiat)?.symbol;
        await sdk.storage.set(AppKey.FIAT, fiat);
        if (symbol) {
            await sdk.storage.set<StoredFiatSymbol>(AppKey.FIAT_SYMBOL, { code: fiat, symbol });
        } else {
            await sdk.storage.delete(AppKey.FIAT_SYMBOL);
        }
        await client.invalidateQueries([AppKey.FIAT]);
    });
};
