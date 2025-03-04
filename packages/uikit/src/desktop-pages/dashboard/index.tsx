import { isPaidSubscription } from '@tonkeeper/core/dist/entries/pro';
import { FC } from 'react';
import styled, { css } from 'styled-components';
import { DashboardTable } from '../../components/dashboard/DashboardTable';
import { DesktopDashboardHeader } from '../../components/desktop/header/DesktopDashboardHeader';
import { desktopHeaderContainerHeight } from '../../components/desktop/header/DesktopHeaderElements';
import { ProBanner } from '../../components/pro/ProBanner';
import { useProState } from '../../state/pro';
import { HideOnReview } from '../../components/ios/HideOnReview';
import { DesktopViewPageLayout } from '../../components/desktop/DesktopViewLayout';
import { NotForTargetEnv } from '../../components/shared/TargetEnv';

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

    ${p =>
        p.theme.proDisplayType === 'mobile' &&
        css`
            height: calc(100% - env(safe-area-inset-top));
        `}
`;

const DashboardPage: FC = () => {
    const { data } = useProState();
    const shouldShowProBanner = data && !isPaidSubscription(data.subscription);

    return (
        <>
            <NotForTargetEnv env="mobile">
                <DesktopDashboardHeader />
            </NotForTargetEnv>
            <PageWrapper>
                <DashboardTableStyled />
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
