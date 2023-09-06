import { useQuery } from '@tanstack/react-query';
import { Language, localizationText } from '@tonkeeper/core/dist/entries/language';
import { Network } from '@tonkeeper/core/dist/entries/network';
import {
    TonendpoinFiatMethods,
    Tonendpoint,
    TonendpointConfig,
    getFiatMethods,
    getServerConfig
} from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { useMemo } from 'react';
import { QueryKey, TonkeeperApiKey } from '../libs/queryKey';

export const useTonendpoint = (build: string, network?: Network, lang?: Language) => {
    return useMemo(() => {
        return new Tonendpoint({ build, network, lang: localizationText(lang) }, {});
    }, [build, network, lang]);
};

export const useTonenpointConfig = (tonendpoint: Tonendpoint) => {
    return useQuery<TonendpointConfig, Error>(
        [QueryKey.tonkeeperApi, TonkeeperApiKey.config, tonendpoint],
        async () => {
            return getServerConfig(tonendpoint);
        }
    );
};

export const DefaultRefetchInterval = 60000; // 60 sec

export const useTonenpointFiatMethods = (tonendpoint: Tonendpoint) => {
    return useQuery<TonendpoinFiatMethods, Error>(
        [QueryKey.tonkeeperApi, TonkeeperApiKey.stock, tonendpoint.params.lang],
        async () => {
            return getFiatMethods(tonendpoint);
        }
    );
};
