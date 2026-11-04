import { useQuery } from '@tanstack/react-query';

import { AssetDetails, getAssetDetails } from '@tonkeeper/core/dist/service/tradingService';
import { ResponseError } from '@tonkeeper/core/dist/tradingApiGenerated';

import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { useUserFiat } from '../fiat';

/**
 * `X-Lang` localizes the About section server-side; the header requires the
 * trading backend to grant it in the CORS preflight (see useShelvesConfig).
 *
 * Resolves to `null` for an asset the trading catalog doesn't know — a
 * wallet-only token has no details page to show and that is not an error.
 * Any other failure rejects so the screen can offer a retry.
 */
export const useAssetDetails = (assetId: string) => {
    const fiat = useUserFiat();
    const {
        i18n: { language }
    } = useTranslation();

    return useQuery<AssetDetails | null, Error>(
        [QueryKey.tradingAssetDetails, assetId, fiat, language],
        async (): Promise<AssetDetails | null> => {
            try {
                return await getAssetDetails({ assetId, currency: fiat, lang: language });
            } catch (e) {
                if (e instanceof ResponseError && e.response.status === 404) {
                    return null;
                }
                throw e;
            }
        },
        {
            enabled: !!assetId,
            refetchOnWindowFocus: false,
            keepPreviousData: true,
            retry: false
        }
    );
};
