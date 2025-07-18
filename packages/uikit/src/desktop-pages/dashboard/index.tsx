import { isPaidSubscription } from '@tonkeeper/core/dist/entries/pro';
import { FC } from 'react';
import styled, { css } from 'styled-components';
import { DashboardTable } from '../../components/dashboard/DashboardTable';
import {
    DPDashboardHeader,
    MPDashboardHeader
} from '../../components/desktop/header/DashboardHeader';
import { desktopHeaderContainerHeight } from '../../components/desktop/header/DesktopHeaderElements';
import { ProBanner } from '../../components/pro/ProBanner';
import { useProState } from '../../state/pro';
import { HideOnReview } from '../../components/ios/HideOnReview';
import { DesktopViewPageLayout } from '../../components/desktop/DesktopViewLayout';
import { ForTargetEnv, NotForTargetEnv } from '../../components/shared/TargetEnv';
import { MPCarouselScroll } from '../../components/shared/MPCarouselScroll';
import { useAppTargetEnv } from '../../hooks/appSdk';
import { Navigate } from '../../components/shared/Navigate';
import { AppRoute } from '../../libs/routes';

const DashboardTableStyled = styled(DashboardTable)``;

const ProBannerWrapper = styled.div`
    padding: 1rem;
    position: sticky;
    bottom: 0;
    left: 0;
    background: ${p => p.theme.gradientBackgroundBottom};
`;

const PageWrapper = styled(DesktopViewPageLayout)`
    overflow: auto;
    position: relative;
    height: calc(100% - ${desktopHeaderContainerHeight});
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    &::after {
        display: none;
    }

    ${p =>
        p.theme.proDisplayType === 'mobile' &&
        css`
            height: calc(100% - env(safe-area-inset-top));
        `}
`;

const DashboardPage: FC = () => {
    const { data } = useProState();
    const shouldShowProBanner = data && !isPaidSubscription(data.current);

    const env = useAppTargetEnv();
    if (env === 'mobile') {
        return <Navigate to={AppRoute.home} />;
    }

    return (
        <>
            <NotForTargetEnv env="mobile">
                <DPDashboardHeader />
            </NotForTargetEnv>
            <PageWrapper>
                <ForTargetEnv env="mobile">
                    <MPDashboardHeader />
                </ForTargetEnv>
                <MPCarouselScroll>
                    <DashboardTableStyled />
                </MPCarouselScroll>
                <HideOnReview>
                    {shouldShowProBanner && (
                        <ProBannerWrapper>
                            <ProBanner />
                        </ProBannerWrapper>
                    )}
                </HideOnReview>
            </PageWrapper>
        </>
    );
};

export default DashboardPage;
