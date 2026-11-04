import { useQuery } from '@tanstack/react-query';
import { fetchExchangeLayoutPreferringFiat } from '@tonkeeper/core/dist/onrampApi';
import type { ExchangeLayoutCards } from '@tonkeeper/core/dist/onrampApi';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { QueryKey } from '../../libs/queryKey';
import { useUserFiatQuery } from '../../state/fiat';
import { useActiveConfig } from '../wallet';
import { useOnrampClientContext } from './useOnrampClientContext';

/**
 * The app's primary currency is requested as the deposit fiat; the
 * backend echoes it back through `card.preferredCurrency`. When the
 * backend can't serve it (rejected code or no cards), the layout falls
 * back to the geo-derived default. GRAM is selectable as the primary
 * currency but isn't fiat, so it goes straight to the geo request.
 */
export const useExchangeLayout = (flow: 'deposit' | 'withdraw' = 'deposit') => {
    const config = useActiveConfig();
    const ctx = useOnrampClientContext();
    const { data: userFiat } = useUserFiatQuery();
    const baseUrl = config.web_swaps_url ?? '';
    const fiat = userFiat === FiatCurrencies.GRAM ? undefined : userFiat;

    return useQuery<ExchangeLayoutCards, Error>(
        [
            QueryKey.exchangeLayout,
            baseUrl,
            flow,
            fiat,
            ctx.deviceCountryCode,
            ctx.timezone,
            ctx.platform,
            ctx.lang
        ],
        () =>
            fetchExchangeLayoutPreferringFiat(
                baseUrl,
                {
                    flow,
                    deviceCountryCode: ctx.deviceCountryCode,
                    timezone: ctx.timezone,
                    platform: ctx.platform,
                    lang: ctx.lang
                },
                fiat
            ),
        {
            enabled: !!baseUrl && userFiat !== undefined,
            staleTime: 5 * 60 * 1000
        }
    );
};
