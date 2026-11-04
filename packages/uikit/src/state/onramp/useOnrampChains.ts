import { useQuery } from '@tanstack/react-query';
import { fetchOnrampChains } from '@tonkeeper/core/dist/onrampApi';
import { QueryKey } from '../../libs/queryKey';
import { useActiveConfig } from '../wallet';
import { useOnrampClientContext } from './useOnrampClientContext';

/** Chains with at least one purchasable asset, as first asset-id segments. */
export const useOnrampChains = (fiat?: string) => {
    const config = useActiveConfig();
    const ctx = useOnrampClientContext();
    const baseUrl = config.web_swaps_url ?? '';

    return useQuery<string[], Error>(
        [
            QueryKey.onrampChains,
            baseUrl,
            ctx.deviceCountryCode,
            ctx.timezone,
            ctx.platform,
            ctx.build,
            ctx.lang,
            ctx.walletId,
            fiat
        ],
        async () => {
            const { chains } = await fetchOnrampChains(baseUrl, {
                fiat,
                xWalletID: ctx.walletId,
                deviceCountryCode: ctx.deviceCountryCode,
                timezone: ctx.timezone,
                platform: ctx.platform,
                build: ctx.build,
                lang: ctx.lang
            });
            return Array.from(new Set(chains.map(chain => chain.split('/')[0]).filter(Boolean)));
        },
        {
            enabled: !!baseUrl,
            staleTime: 5 * 60 * 1000
        }
    );
};
