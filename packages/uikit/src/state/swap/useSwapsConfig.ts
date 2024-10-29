import { useAppContext } from '../../hooks/appContext';
import { OpenAPI, SwapService } from '@tonkeeper/core/dist/swapsApi';

export const useSwapsConfig = () => {
    const { config } = useAppContext();

    OpenAPI.BASE = 'http://164.92.148.115:8080'; // config.web_swaps_url!;
    return {
        swapService: SwapService,
        referralAddress: config.web_swaps_referral_address,
        isSwapsEnabled: !!config.web_swaps_url
    };
};
