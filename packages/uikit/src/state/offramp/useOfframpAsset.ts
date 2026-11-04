import { useQuery } from '@tanstack/react-query';
import { fetchOfframpAsset } from '@tonkeeper/core/dist/offrampApi';
import type { OfframpAssetDetail } from '@tonkeeper/core/dist/offrampApi';
import { QueryKey } from '../../libs/queryKey';
import { useActiveConfig } from '../wallet';
import { useOnrampClientContext } from '../onramp/useOnrampClientContext';

export const useOfframpAsset = (assetId: string | undefined) => {
    const config = useActiveConfig();
    const ctx = useOnrampClientContext();
    const baseUrl = config.web_swaps_url ?? '';

    return useQuery<OfframpAssetDetail, Error>(
        [
            QueryKey.offrampAsset,
            baseUrl,
            assetId,
            ctx.deviceCountryCode,
            ctx.timezone,
            ctx.platform,
            ctx.build,
            ctx.lang
        ],
        () =>
            fetchOfframpAsset(baseUrl, {
                assetId: assetId!,
                deviceCountryCode: ctx.deviceCountryCode,
                timezone: ctx.timezone,
                platform: ctx.platform,
                build: ctx.build,
                lang: ctx.lang
            }),
        {
            enabled: !!baseUrl && !!assetId,
            staleTime: 5 * 60 * 1000
        }
    );
};
