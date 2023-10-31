import { useQuery } from '@tanstack/react-query';
import { Language, localizationText } from '@tonkeeper/core/dist/entries/language';
import { Network } from '@tonkeeper/core/dist/entries/network';
import {
    TonendpoinFiatCategory,
    TonendpoinFiatItem,
    Tonendpoint,
    TonendpointConfig,
    getFiatMethods,
    getServerConfig
} from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { useMemo } from 'react';
import { useAppContext } from '../hooks/appContext';
import { QueryKey, TonkeeperApiKey } from '../libs/queryKey';
import { useUserCountry } from './country';

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

export const useTonendpointBuyMethods = () => {
    const { tonendpoint } = useAppContext();
    const { data: countryCode } = useUserCountry();
    return useQuery<TonendpoinFiatCategory, Error>(
        [QueryKey.tonkeeperApi, TonkeeperApiKey.fiat, tonendpoint.params.lang, countryCode],
        async () => {
            const methods = await getFiatMethods(tonendpoint, countryCode);
            const buy = methods.categories[0];

            const layout = methods.layoutByCountry.find(item => item.countryCode === countryCode);

            const buildMethods = (acc: TonendpoinFiatItem[], id: string) => {
                const method = buy.items.find(item => item.id === id);
                if (method) {
                    acc.push(method);
                }
                return acc;
            };

            return {
                ...buy,
                items: layout
                    ? layout.methods.reduce(buildMethods, [] as TonendpoinFiatItem[])
                    : methods.defaultLayout.methods.reduce(buildMethods, [] as TonendpoinFiatItem[])
            };
        }
    );
};
