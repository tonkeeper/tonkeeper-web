import { useMemo } from 'react';
import { useActiveConfig } from '../wallet';
import { useAppContext } from '../../hooks/appContext';

export const useSwapsConfig = () => {
    const config = useActiveConfig();
    const { tonendpoint } = useAppContext();

    // Swap is a recently added query-param consumer, so it reports platform
    // 'web' (like the X-App-Platform header). The pre-existing boot/api params
    // keep their real per-app platform.
    const queryParams = useMemo(
        () => tonendpoint.getCommonQueryParams({ platform: 'web' }),
        [tonendpoint]
    );

    return {
        baseUrl: config.web_swaps_url ?? '',
        isSwapsEnabled: !!config.web_swaps_url,
        queryParams
    };
};
