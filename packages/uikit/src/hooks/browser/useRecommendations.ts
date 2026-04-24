import { useQuery } from '@tanstack/react-query';
import {
    CarouselApp,
    isCarouselApp,
    isPromotedApp,
    PromotionCategory,
    Recommendations
} from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { QueryKey } from '../../libs/queryKey';
import { useAppContext } from '../appContext';

function shuffle<T>(array: T[]) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
}

export function useRecommendations() {
    const { tonendpoint } = useAppContext();

    return useQuery<Recommendations, Error>([QueryKey.featuredRecommendations], async () => {
        const raw = await tonendpoint.appsPopular();

        /**
         * The OpenAPI spec marks `url`, `icon` and `poster` as optional, but
         * the UI treats them as required. Filter out entries that are missing
         * any of the fields the renderers need — effectively discarding data
         * we can't render anyway.
         */
        const apps: CarouselApp[] = raw.apps.filter(isCarouselApp);
        const categories: PromotionCategory[] = raw.categories
            // TODO: Remove mobile hack
            .filter(category => category.id !== 'featured')
            .map(category => ({
                ...category,
                apps: category.apps.filter(isPromotedApp)
            }));

        shuffle(apps);

        return {
            ...raw,
            apps,
            categories
        };
    });
}
