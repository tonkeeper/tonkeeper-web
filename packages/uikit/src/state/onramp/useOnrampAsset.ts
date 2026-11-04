import { useQuery } from '@tanstack/react-query';
import { fetchOnrampAsset } from '@tonkeeper/core/dist/onrampApi';
import type { OnrampAssetDetail } from '@tonkeeper/core/dist/onrampApi';
import { QueryKey } from '../../libs/queryKey';
import { useActiveConfig } from '../wallet';
import { useOnrampClientContext } from './useOnrampClientContext';

export const useOnrampAsset = (assetId: string | undefined) => {
    const config = useActiveConfig();
    const ctx = useOnrampClientContext();
    const baseUrl = config.web_swaps_url ?? '';

    return useQuery<OnrampAssetDetail, Error>(
        [
            QueryKey.onrampAsset,
            baseUrl,
            assetId,
            ctx.deviceCountryCode,
            ctx.timezone,
            ctx.platform,
            ctx.build,
            ctx.lang,
            ctx.walletId
        ],
        () =>
            fetchOnrampAsset(baseUrl, {
                assetId: assetId!,
                deviceCountryCode: ctx.deviceCountryCode,
                timezone: ctx.timezone,
                platform: ctx.platform,
                build: ctx.build,
                lang: ctx.lang,
                xWalletID: ctx.walletId
            }),
        {
            enabled: !!baseUrl && !!assetId,
            staleTime: 5 * 60 * 1000
        }
    );
};
