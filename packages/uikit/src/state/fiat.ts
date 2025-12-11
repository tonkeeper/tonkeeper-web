import { useAppSdk } from '../hooks/appSdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { QueryKey } from '../libs/queryKey';
import { useAppContext } from '../hooks/appContext';

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
            return (
                (await sdk.storage.get<FiatCurrencies | undefined>(AppKey.FIAT)) ||
                FiatCurrencies.USD
            );
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
    const client = useQueryClient();
    return useMutation<void, Error, FiatCurrencies>(async fiat => {
        await sdk.storage.set(AppKey.FIAT, fiat);
        await client.invalidateQueries([AppKey.FIAT]);
    });
};
