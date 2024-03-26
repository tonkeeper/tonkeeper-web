import { useQuery } from '@tanstack/react-query';
import { Recommendations } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { QueryKey } from '../../libs/queryKey';
import { useUserCountry } from '../../state/country';
import { useAppContext } from '../appContext';

export function useRecommendations() {
    const { tonendpoint } = useAppContext();
    const country = useUserCountry();
    const lang = country.data || 'en';

    return useQuery<Recommendations, Error>([QueryKey.featuredRecommendations, lang], async () => {
        const data: Recommendations = await tonendpoint.getAppsPopular(lang);
        // TODO: Remove mobile hack
        data.categories = data.categories.filter(item => item.id !== 'featured');

        return data;
    });
}
