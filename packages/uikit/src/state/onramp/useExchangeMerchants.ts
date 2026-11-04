import { useQuery } from '@tanstack/react-query';
import { fetchExchangeMerchants } from '@tonkeeper/core/dist/onrampApi';
import type { ExchangeMerchantInfo } from '@tonkeeper/core/dist/onrampApi';
import { QueryKey } from '../../libs/queryKey';
import { useActiveConfig } from '../wallet';
import { useOnrampClientContext } from './useOnrampClientContext';

export const useExchangeMerchants = () => {
    const config = useActiveConfig();
    const ctx = useOnrampClientContext();
    const baseUrl = config.web_swaps_url ?? '';

    return useQuery<ExchangeMerchantInfo[], Error>(
        [QueryKey.onrampMerchants, baseUrl, ctx.deviceCountryCode, ctx.timezone],
        () =>
            fetchExchangeMerchants(baseUrl, {
                deviceCountryCode: ctx.deviceCountryCode,
                timezone: ctx.timezone
            }),
        {
            enabled: !!baseUrl,
            staleTime: 60 * 60 * 1000
        }
    );
};
