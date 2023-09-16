import { useQuery } from '@tanstack/react-query';
import { Language, localizationText } from '@tonkeeper/core/dist/entries/language';
import { Network } from '@tonkeeper/core/dist/entries/network';
import {
    TonendpoinFiatCategory,
    TonendpoinFiatItem,
    TonendpoinFiatMethods,
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
    const { data: countryCode } = useUserCountry();
    return useMemo(() => {
        return new Tonendpoint({ build, network, lang: localizationText(lang), countryCode }, {});
    }, [build, network, lang, countryCode]);
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

export const useTonendpointBuyMethods = () => {
    const { tonendpoint } = useAppContext();
    return useQuery<TonendpoinFiatCategory, Error>(
        [
            QueryKey.tonkeeperApi,
            TonkeeperApiKey.fiat,
            tonendpoint.params.lang,
            tonendpoint.params.countryCode
        ],
        async () => {
            const methods = await getFiatMethods(tonendpoint);
            const buy = methods.categories[0];

            const layout = methods.layoutByCountry.find(
                item => item.countryCode === tonendpoint.params.countryCode
            );

            const buildMethods = (acc: TonendpoinFiatItem[], id: string) => {
                const method = buy.items.find(item => item.id === id);
                if (method) {
                    acc.push(method);
                }
                return acc;
            };

            console.log(layout);

            return {
                ...buy,
                items: layout
                    ? layout.methods.reduce(buildMethods, [] as TonendpoinFiatItem[])
                    : methods.defaultLayout.methods.reduce(buildMethods, [] as TonendpoinFiatItem[])
            };
        }
    );
};
