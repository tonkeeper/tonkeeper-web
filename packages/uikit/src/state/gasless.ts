import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { useAppContext } from '../hooks/appContext';
import { GaslessApi } from '@tonkeeper/core/dist/tonApiV2';
import { useMemo } from 'react';

export const useGaslessApi = () => {
    const { api } = useAppContext();
    return useMemo(() => new GaslessApi(api.tonApiV2), [api]);
};

export const useGaslessConfigQuery = () => {
    const gaslessApi = useGaslessApi();
    return useQuery([QueryKey.gaslessConfig], async () => {
        return gaslessApi.gaslessConfig();
    });
};

export const useGaslessConfig = () => {
    const { data } = useGaslessConfigQuery();
    if (!data) {
        throw new Error('Gasless config not found');
    }
    return data;
};
