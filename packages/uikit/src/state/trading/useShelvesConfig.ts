import { useQuery } from '@tanstack/react-query';

import {
    getShelvesConfig,
    TradingShelvesConfig
} from '@tonkeeper/core/dist/service/tradingService';

import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { useUserFiat } from '../fiat';

/**
 * Server-composed Trade-tab layout (`/api/v2/trading/shelves/config`). One
 * query feeds every shelf; group order, titles and item sets are
 * server-authoritative. Shelves embed live prices, so they go stale fast —
 * a fresh open refetches while `keepPreviousData` keeps the tab rendered.
 *
 * `X-Lang` localizes the shelf titles server-side. The custom header makes
 * the browser preflight the request, so the trading backend must answer
 * OPTIONS with `Access-Control-Allow-Headers: X-Lang` — without that grant
 * every shelves request fails in the browser.
 */
export const useShelvesConfig = () => {
    const fiat = useUserFiat();
    const {
        i18n: { language }
    } = useTranslation();

    return useQuery<TradingShelvesConfig, Error>(
        [QueryKey.tradingShelvesConfig, fiat, language],
        () => getShelvesConfig({ currency: fiat, lang: language }),
        {
            staleTime: 60_000,
            keepPreviousData: true,
            refetchOnWindowFocus: false,
            retry: false
        }
    );
};
