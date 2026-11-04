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
import { setAppVersionHeaders } from '@tonkeeper/core/dist/utils/appVersion';
import { applyMultichainEndpoints } from '@tonkeeper/core/dist/service/multichainEndpoints';
import { useMemo } from 'react';
import { useAppContext } from '../hooks/appContext';
import { QueryKey, TonkeeperApiKey } from '../libs/queryKey';
import { useToQueryKeyPart } from '../hooks/useToQueryKeyPart';
import { useActiveConfig } from './wallet';
import { useUserCountry } from './country';

export const useTonendpoint = ({
    build,
    network = Network.MAINNET,
    lang = Language.EN,
    platform,
    deviceCountryCode,
    storeCountryCode
}: {
    build: string;
    network?: Network;
    lang?: Language;
    platform: BootParams['platform'];
    deviceCountryCode?: string | null;
    storeCountryCode?: string | null;
}) => {
    return useMemo(() => {
        // Seed the X-App-* headers used by the header-based backends (Battery,
        // Pro). The header platform is always 'web'; the per-app platform is
        // carried by the query-param backends (boot/api/swap) instead.
        setAppVersionHeaders({ version: build });
        return new Tonendpoint({
            build,
            network,
            lang: localizationText(lang),
            platform,
            device_country_code: deviceCountryCode ?? undefined,
            store_country_code: storeCountryCode ?? undefined
        });
    }, [build, network, lang, platform, deviceCountryCode, storeCountryCode]);
};

export interface ServerConfig {
    mainnetConfig: TonendpointConfig;
    testnetConfig: TonendpointConfig;
}

export const useTonenpointConfig = (tonendpoint: Tonendpoint) => {
    const tonendpointKey = useToQueryKeyPart(tonendpoint);

    return useQuery<ServerConfig, Error>(
        [QueryKey.tonkeeperApi, TonkeeperApiKey.config, tonendpointKey],
        async () => {
            const mainnetConfig = await getServerConfig(tonendpoint, Network.MAINNET);
            // The multichain backends serve mainnet only, so the mainnet block
            // decides their hosts regardless of the active TON network.
            applyMultichainEndpoints(mainnetConfig);
            return {
                mainnetConfig,
                testnetConfig: await getServerConfig(tonendpoint, Network.TESTNET)
            };
        },
        {
            // The shells cannot render without a config, so a boot that never
            // got one surfaces the root error screen instead of an endless
            // spinner. A failed background refetch keeps the config it has.
            useErrorBoundary: (_e, query) => query.state.data === undefined
        }
    );
};

export const DefaultRefetchInterval = 60000; // 60 sec

/**
 * Legacy `/fiat/methods` buy list. `enabled` defaults to `false` so the
 * globally-mounted `BuyNotificationControlled` doesn't fire it on every
 * page load — callers pass `true` only when the modal/buy view is actually
 * open. Without this gate the multichain home, which has its own onramp
 * flow via swap.tonkeeper.com, still triggered a stale legacy fetch.
 */
export const useTonendpointBuyMethods = (enabled = false) => {
    const { tonendpoint } = useAppContext();
    const { data: countryCode } = useUserCountry();

    return useQuery<TonendpoinFiatCategory, Error>(
        [QueryKey.tonkeeperApi, TonkeeperApiKey.fiat, tonendpoint?.params.lang],
        async () => {
            const methods = await tonendpoint!.fiatMethods();
            const buy = methods.categories[0];

            const layout = methods.layoutByCountry.find(item => item.countryCode === countryCode);

            const buildMethods = (acc: TonendpoinFiatItem[], id: string) => {
                const method = buy.items?.find(item => item.id === id);
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
        },
        {
            enabled: enabled && !!countryCode && !!tonendpoint
        }
    );
};

export const useCreateMercuryoProUrl = () => {
    const { mainnetConfig } = useAppContext();

    return useMutation<string, Error, string>(async baseUrl => {
        try {
            if (!mainnetConfig?.mercuryo_otc_id) {
                throw new Error('Missing mercuryo get otc url');
            }
            const mercurioConfig = (await (await fetch(mainnetConfig.mercuryo_otc_id)).json()) as {
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

export enum FLAGGED_FEATURE {
    BATTERY = 'battery',
    GASLESS = 'gasless',
    SWAPS = 'swaps',
    TRON = 'tron',
    TWO_FA = '2fa',
    ONRAMP = 'onramp',
    DAPPS_LIST = 'dapps_list',
    ETHENA = 'ethena',
    NFT = 'nft',
    CRYPTO_SUBSCRIPTION = 'crypto_subscription',
    STAKING = 'staking'
}
const flagsMapping: Record<FLAGGED_FEATURE, keyof TonendpointConfig['flags']> = {
    battery: 'disable_battery',
    gasless: 'disable_gaseless',
    swaps: 'disable_swap',
    tron: 'disable_tron',
    '2fa': 'disable_2fa',
    onramp: 'disable_exchange_methods',
    dapps_list: 'disable_dapps',
    ethena: 'disable_usde',
    nft: 'disable_nfts',
    crypto_subscription: 'disable_crypto_subscription',
    staking: 'disable_staking'
};

export function useIsFeatureEnabled(feature: FLAGGED_FEATURE) {
    const config = useActiveConfig();
    return !config.flags[flagsMapping[feature]];
}
