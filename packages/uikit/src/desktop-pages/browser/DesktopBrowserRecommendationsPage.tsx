import { FC } from 'react';
import styled from 'styled-components';
import { useRecommendations } from '../../hooks/browser/useRecommendations';
import { PromotionsCarousel } from '../../components/browser/PromotionsCarousel';
import { DesktopCategoryBlock } from './DesktopCategoryBlock';
import { HideOnReview } from '../../components/ios/HideOnReview';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { useAppTargetEnv } from '../../hooks/appSdk';
import { ForTargetEnv } from '../../components/shared/TargetEnv';
import { useTranslation } from '../../hooks/translation';
import { useTrackDappBrowserOpened } from '../../hooks/analytics/events-hooks';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../state/tonendpoint';
import { Navigate } from '../../components/shared/Navigate';
import { AppRoute } from '../../libs/routes';

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

    &::after {
        display: none;
    }
`;

export const DesktopBrowserRecommendationsPage: FC = () => {
    const { t } = useTranslation();
    const { data } = useRecommendations();
    const targetEnv = useAppTargetEnv();
    const dappsListEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.DAPPS_LIST);

    useTrackDappBrowserOpened();

    if (!dappsListEnabled) {
        return <Navigate to={AppRoute.home} />;
    }

    if (!data) {
        return null;
    }

    return (
        <HideOnReview>
            <CategoriesWrapper>
                <ForTargetEnv env="mobile">
                    <DesktopViewHeader>
                        <DesktopViewHeaderContent title={t('aside_discover')} />
                    </DesktopViewHeader>
                </ForTargetEnv>
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
