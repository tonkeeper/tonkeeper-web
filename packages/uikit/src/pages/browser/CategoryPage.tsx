import { SubHeader } from '../../components/SubHeader';
import { InnerBody } from '../../components/Body';
import React from 'react';
import { CategoryGroupItem } from './CategoryBlock';
import { ListBlock } from '../../components/List';
import { useRecommendations } from '../../hooks/browser/useRecommendations';
import { RecommendationPageListItemSkeleton } from '../../components/skeletons/BrowserSkeletons';
import { HideOnReview } from '../../components/ios/HideOnReview';
import { useParams } from '../../hooks/router/useParams';

export const CategoryPage = () => {
    const { id } = useParams();
    const { data } = useRecommendations();

    const group = data?.categories.find(item => item.id === id);

    return (
        <HideOnReview>
            <SubHeader title={group?.title} />
            <InnerBody>
                {group ? (
                    <ListBlock>
                        {group.apps.map(item => (
                            <CategoryGroupItem key={item.url} item={item} />
                        ))}
                    </ListBlock>
                ) : (
                    <ListBlock>
                        <RecommendationPageListItemSkeleton />
                        <RecommendationPageListItemSkeleton />
                        <RecommendationPageListItemSkeleton />
                        <RecommendationPageListItemSkeleton />
                        <RecommendationPageListItemSkeleton />
                    </ListBlock>
                )}
            </InnerBody>
        </HideOnReview>
    );
};
