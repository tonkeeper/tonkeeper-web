import { useMutation } from '@tanstack/react-query';
import { fetchOfframpQuote } from '@tonkeeper/core/dist/offrampApi';
import type { OfframpQuoteRequest, OfframpQuotes } from '@tonkeeper/core/dist/offrampApi';
import { useActiveConfig } from '../wallet';
import { useOnrampClientContext } from '../onramp/useOnrampClientContext';

export const useOfframpQuote = () => {
    const config = useActiveConfig();
    const ctx = useOnrampClientContext();
    const baseUrl = config.web_swaps_url ?? '';

    return useMutation<OfframpQuotes, Error, OfframpQuoteRequest>(body =>
        fetchOfframpQuote(baseUrl, {
            offrampQuoteRequest: body,
            deviceCountryCode: ctx.deviceCountryCode,
            timezone: ctx.timezone,
            platform: ctx.platform,
            build: ctx.build
        })
    );
};
