import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { GaslessApi } from '@tonkeeper/core/dist/tonApiV2';
import { useMemo } from 'react';
import { useActiveApi } from './wallet';
import { ServerConfig } from './tonendpoint';
import { useAppContext } from '../hooks/appContext';

export const useGaslessApi = () => {
    const api = useActiveApi();
    return useMemo(() => new GaslessApi(api.tonApiV2), [api]);
};

export const useGaslessConfigQuery = (mainnetConfig?: ServerConfig['mainnetConfig']) => {
    const gaslessApi = useGaslessApi();
    return useQuery(
        [QueryKey.gaslessConfig, mainnetConfig?.tonapiV2Endpoint],
        async () => {
            return gaslessApi.gaslessConfig();
        },
        {
            keepPreviousData: true,
            suspense: true,
            enabled: Boolean(mainnetConfig)
        }
    );
};

export const useGaslessConfig = () => {
    const { mainnetConfig } = useAppContext();
    const { data } = useGaslessConfigQuery(mainnetConfig);

    if (!data) {
        throw new Error('Gasless config not found');
    }

    return data;
};
