import { FC, useEffect } from 'react';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { BrowserHeader } from '../../components/Header';
import { PromotionsCarousel } from '../../components/browser/PromotionsCarousel';
import { RecommendationsPageBodySkeleton } from '../../components/skeletons/BrowserSkeletons';
import { useOpenBrowser } from '../../hooks/amplitude';
import { useRecommendations } from '../../hooks/browser/useRecommendations';
import { CategoryBlock } from './CategoryBlock';
import { HideOnReview } from '../../components/ios/HideOnReview';

const InnerBodyStyled = styled(InnerBody)`
    padding: 0;
`;

const PromotionsCarouselStyled = styled(PromotionsCarousel)`
    margin-bottom: 1rem;
`;

const CategoryBlockStyled = styled(CategoryBlock)`
    margin-bottom: 1rem;
`;

const SkeletonContainer = styled.div`
    padding: 0 1rem;
`;

export const BrowserRecommendationsPage: FC = () => {
    const { data } = useRecommendations();

    const track = useOpenBrowser();
    useEffect(() => {
        if (data) track();
    }, [track, data]);

    return (
        <HideOnReview>
            <BrowserHeader />
            <InnerBodyStyled>
                {data ? (
                    <>
                        {data.apps.length > 0 ? (
                            <PromotionsCarouselStyled apps={data.apps} />
                        ) : null}
                        {data.categories.map(category => (
                            <CategoryBlockStyled key={category.id} category={category} />
                        ))}
                    </>
                ) : (
                    <SkeletonContainer>
                        <RecommendationsPageBodySkeleton />
                    </SkeletonContainer>
                )}
            </InnerBodyStyled>
        </HideOnReview>
    );
};
