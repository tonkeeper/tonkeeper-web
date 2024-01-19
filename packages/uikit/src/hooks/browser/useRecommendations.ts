import { useUserCountry } from '../../state/country';
import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';

export interface CarouselApp extends PromotedApp {
    poster: string;
}

export interface PromotedApp {
    name: string;
    description: string;
    icon: string;
    url: string;
    textColor?: string;
}

export interface PromotionCategory {
    id: string;
    title: string;
    apps: PromotedApp[];
}

export interface Recommendations {
    categories: PromotionCategory[];
    apps: CarouselApp[];
}

export function useRecommendations() {
    const country = useUserCountry();
    const lang = country.data || 'en';

    return useQuery<Recommendations, Error>([QueryKey.featuredRecommendations, lang], async () => {
        const result = await (
            await fetch(`https://api.tonkeeper.com/apps/popular?lang=${lang}`)
        ).json();
        if (!result.success) {
            throw new Error('Fetch recommendations api error: success false');
        }
        return result.data;
    });
}
