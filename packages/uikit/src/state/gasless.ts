import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { GaslessApi } from '@tonkeeper/core/dist/tonApiV2';
import { useMemo } from 'react';
import { useActiveApi } from './wallet';

export const useGaslessApi = () => {
    const api = useActiveApi();
    return useMemo(() => new GaslessApi(api.tonApiV2), [api]);
};

export const useGaslessConfigQuery = () => {
    const gaslessApi = useGaslessApi();
    return useQuery(
        [QueryKey.gaslessConfig],
        async () => {
            return gaslessApi.gaslessConfig();
        },
        {
            keepPreviousData: true,
            suspense: true
        }
    );
};

export const useGaslessConfig = () => {
    const { data } = useGaslessConfigQuery();
    if (!data) {
        throw new Error('Gasless config not found');
    }
    return data;
};
