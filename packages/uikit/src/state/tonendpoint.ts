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
import { TargetEnv } from '@tonkeeper/core/dist/AppSdk';

export const useTonendpoint = ({
    targetEnv,
    build,
    network = Network.MAINNET,
    lang = Language.EN,
    platform
}: {
    targetEnv: TargetEnv;
    build: string;
    network?: Network;
    lang?: Language;
    platform: BootParams['platform'];
}) => {
    return useMemo(() => {
        return new Tonendpoint(
            {
                build,
                network,
                lang: localizationText(lang),
                targetEnv,
                platform
            },
            {}
        );
    }, [targetEnv, build, network, lang, platform]);
};

export interface ServerConfig {
    mainnetConfig: TonendpointConfig;
    testnetConfig: TonendpointConfig;
}

export const useTonenpointConfig = (tonendpoint: Tonendpoint) => {
    return useQuery<ServerConfig, Error>(
        [QueryKey.tonkeeperApi, TonkeeperApiKey.config, tonendpoint],
        async () => {
            const country = await tonendpoint.country();
            tonendpoint.setCountryCode(country.country);
            return {
                mainnetConfig: await getServerConfig(tonendpoint, Network.MAINNET),
                testnetConfig: await getServerConfig(tonendpoint, Network.TESTNET)
            };
        }
    );
};

export const DefaultRefetchInterval = 60000; // 60 sec

export const useTonendpointBuyMethods = () => {
    const { tonendpoint } = useAppContext();
    return useQuery<TonendpoinFiatCategory, Error>(
        [QueryKey.tonkeeperApi, TonkeeperApiKey.fiat, tonendpoint.params.lang],
        async () => {
            const methods = await tonendpoint.getFiatMethods();
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
    const { data: serverConfig } = useTonenpointConfig(tonendpoint);

    return useMutation<string, Error, string>(async baseUrl => {
        const data = serverConfig?.mainnetConfig;
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
