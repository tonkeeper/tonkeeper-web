import { useAppContext } from '../../hooks/appContext';
import { OpenAPI, SwapService } from '@tonkeeper/core/dist/swapsApi';

export const useSwapsConfig = () => {
    const { config } = useAppContext();

    // OpenAPI.BASE = config.web_swaps_url;
    OpenAPI.BASE = 'http://localhost:8080'; // TODO: remove after server is ready
    return {
        swapService: SwapService,
        referralAddress: config.web_swaps_referral_address,
        isSwapsEnabled: !!config.web_swaps_url
    };
};
