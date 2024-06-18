import { useMutation, useQuery } from '@tanstack/react-query';
import { Language, localizationText } from '@tonkeeper/core/dist/entries/language';
import { Network } from '@tonkeeper/core/dist/entries/network';
import {
    TonendpoinFiatCategory,
    TonendpoinFiatItem,
    Tonendpoint,
    TonendpointConfig,
    getServerConfig,
    BootParams
} from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { useMemo } from 'react';
import { useAppContext } from '../hooks/appContext';
import { QueryKey, TonkeeperApiKey } from '../libs/queryKey';
import { useUserCountry } from './country';
import { TargetEnv } from '@tonkeeper/core/dist/AppSdk';

export const useTonendpoint = (options: {
    targetEnv: TargetEnv;
    build: string;
    network?: Network;
    lang?: Language;
    platform?: BootParams['platform'];
}) => {
    return useMemo(() => {
        return new Tonendpoint(
            {
                build: options.build,
                network: options.network,
                lang: localizationText(options.lang),
                targetEnv: options.targetEnv,
                platform: options.platform
            },
            {}
        );
    }, [options.targetEnv, options.build, options.network, options.lang, options.platform]);
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
            const methods = await tonendpoint.getFiatMethods(countryCode);
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

export const useCreateMercuryoProUrl = () => {
    const { tonendpoint } = useAppContext();
    const { data } = useTonenpointConfig(tonendpoint);

    return useMutation<string, Error, string>(async baseUrl => {
        try {
            if (!data?.mercuryo_otc_id) {
                throw new Error('Missing mercuryo get otc url');
            }
            const mercurioConfig = (await (await fetch(data.mercuryo_otc_id)).json()) as {
                data: {
                    otc_id: string;
                };
            };

            if (!mercurioConfig.data.otc_id) {
                throw new Error('Missing mercuryo otc_id');
            }

            const url = new URL(baseUrl);
            url.searchParams.append('otc_id', mercurioConfig.data.otc_id);
            return url.toString();
        } catch (e) {
            console.error(e);
            return baseUrl;
        }
    });
};
