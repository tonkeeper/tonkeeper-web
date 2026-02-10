import { useActiveConfig } from '../wallet';

export const useSwapsConfig = () => {
    const config = useActiveConfig();

    return {
        baseUrl: config.web_swaps_url ?? '',
        isSwapsEnabled: !!config.web_swaps_url
    };
};
