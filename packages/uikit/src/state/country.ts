import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';

export const useUserCountry = () => {
    const { tonendpoint } = useAppContext();
    return useQuery<string | null, Error>(
        [QueryKey.country],
        async () => {
            const response = await tonendpoint.country();
            return response.country;
        },
        {
            keepPreviousData: true
        }
    );
};

export const useAppCountryInfo = () => {
    const sdk = useAppSdk();
    return useQuery([QueryKey.appCountryInfo], async () => sdk.getAppCountryInfo(), {
        suspense: true,
        staleTime: Infinity
    });
};
