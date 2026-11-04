import { useMutation } from '@tanstack/react-query';
import { fetchOnrampQuote } from '@tonkeeper/core/dist/onrampApi';
import type { OnrampQuoteRequest, OnrampQuotes } from '@tonkeeper/core/dist/onrampApi';
import { useActiveConfig } from '../wallet';
import { useOnrampClientContext } from './useOnrampClientContext';

export const useOnrampQuote = () => {
    const config = useActiveConfig();
    const ctx = useOnrampClientContext();
    const baseUrl = config.web_swaps_url ?? '';

    return useMutation<OnrampQuotes, Error, OnrampQuoteRequest>(body =>
        fetchOnrampQuote(baseUrl, {
            onrampQuoteRequest: body,
            deviceCountryCode: ctx.deviceCountryCode,
            timezone: ctx.timezone,
            platform: ctx.platform,
            build: ctx.build,
            xWalletID: ctx.walletId
        })
    );
};
