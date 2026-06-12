import { useMemo } from 'react';
import { useActiveConfig } from '../wallet';
import { useAppContext } from '../../hooks/appContext';

export const useSwapsConfig = () => {
    const config = useActiveConfig();
    const { tonendpoint } = useAppContext();

    const queryParams = useMemo(() => tonendpoint.getCommonQueryParams(), [tonendpoint]);

    return {
        baseUrl: config.web_swaps_url ?? '',
        isSwapsEnabled: !!config.web_swaps_url,
        queryParams
    };
};
