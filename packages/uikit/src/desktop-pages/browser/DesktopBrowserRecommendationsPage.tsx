import { FC, useEffect } from 'react';
import styled from 'styled-components';
import { useOpenBrowser } from '../../hooks/amplitude';
import { useRecommendations } from '../../hooks/browser/useRecommendations';
import { PromotionsCarousel } from '../../components/browser/PromotionsCarousel';
import { DesktopCategoryBlock } from './DesktopCategoryBlock';
import { HideOnReview } from '../../components/ios/HideOnReview';
import { DesktopViewPageLayout } from '../../components/desktop/DesktopViewLayout';
import { useAppTargetEnv } from '../../hooks/appSdk';

const PromotionsCarouselStyled = styled(PromotionsCarousel)`
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
`;

const CategoryBlockStyled = styled(DesktopCategoryBlock)`
    margin-bottom: 0.5rem;

    &:last-child {
        margin-bottom: 0;
    }
`;

const CategoriesWrapper = styled(DesktopViewPageLayout)`
    padding-bottom: 0.5rem;
    overflow: auto;
    height: 100%;
`;

export const DesktopBrowserRecommendationsPage: FC = () => {
    const { data } = useRecommendations();
    const targetEnv = useAppTargetEnv();

    const track = useOpenBrowser();
    useEffect(() => {
        if (data) track();
    }, [track, data]);

    if (!data) {
        return null;
    }

    return (
        <HideOnReview>
            <CategoriesWrapper>
                <PromotionsCarouselStyled
                    apps={data.apps}
                    slidesToShow={targetEnv === 'mobile' ? 1 : 2}
                />
                {data.categories.map((category, index) => (
                    <CategoryBlockStyled
                        key={category.id}
                        category={category}
                        hideDivider={index === 0}
                    />
                ))}
            </CategoriesWrapper>
        </HideOnReview>
    );
};
