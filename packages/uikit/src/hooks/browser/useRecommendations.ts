import { useQuery } from '@tanstack/react-query';
import { Recommendations } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { QueryKey } from '../../libs/queryKey';
import { useUserCountry } from '../../state/country';
import { useAppContext } from '../appContext';

function shuffle<T>(array: T[]) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
}

export function useRecommendations() {
    const { tonendpoint } = useAppContext();

    return useQuery<Recommendations, Error>([QueryKey.featuredRecommendations], async () => {
        const data: Recommendations = await tonendpoint.getAppsPopular();
        // TODO: Remove mobile hack
        data.categories = data.categories.filter(item => item.id !== 'featured');

        if (data.apps) {
            shuffle(data.apps);
        }

        return data;
    });
}
