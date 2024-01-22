import { FC } from 'react';
import styled from 'styled-components';
import { useRecommendations } from '../../hooks/browser/useRecommendations';
import { PromotionsCarousel } from './PromotionsCarousel';
import { CategoryBlock } from './CategoryBlock';
import { InnerBody } from '../../components/Body';
import { RecommendationsPageBodySkeleton } from '../../components/skeletons/BrowserSkeletons';
import { BrowserHeader } from '../../components/Header';

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

    return (
        <div>
            <BrowserHeader />

            <InnerBodyStyled>
                {data ? (
                    <>
                        <PromotionsCarouselStyled apps={data.apps} />
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
        </div>
    );
};
