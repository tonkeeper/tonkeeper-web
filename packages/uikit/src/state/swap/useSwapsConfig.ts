import { OpenAPI, SwapService } from '@tonkeeper/core/dist/swapsApi';
import { useActiveConfig } from '../wallet';

export const useSwapsConfig = () => {
    const config = useActiveConfig();

    OpenAPI.BASE = config.web_swaps_url!;
    return {
        swapService: SwapService,
        referralAddress: config.web_swaps_referral_address,
        isSwapsEnabled: !!config.web_swaps_url
    };
};
