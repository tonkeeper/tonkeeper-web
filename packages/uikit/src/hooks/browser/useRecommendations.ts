import { useUserCountry } from '../../state/country';
import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';
import { Recommendations } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { useAppContext } from '../appContext';

export function useRecommendations() {
    const { tonendpoint } = useAppContext();
    const country = useUserCountry();
    const lang = country.data || 'en';

    return useQuery<Recommendations, Error>([QueryKey.featuredRecommendations, lang], async () => {
        return tonendpoint.getAppsPopular(lang);
    });
}
