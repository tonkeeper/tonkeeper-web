import { DashboardTable } from '../../components/dashboard/DashboardTable';
import { FC } from 'react';
import styled from 'styled-components';
import { ProBanner } from '../../components/pro/ProBanner';
import { useProState } from '../../state/pro';
import { isPaidSubscription } from '@tonkeeper/core/dist/entries/pro';
import { DesktopDashboardHeader } from '../../components/desktop/header/DesktopDashboardHeader';

const DashboardTableStyled = styled(DashboardTable)``;

const ProBannerWrapper = styled.div`
    padding: 1rem;
    position: sticky;
    bottom: 0;
    left: 0;
    background: ${p => p.theme.gradientBackgroundBottom};
`;

const PageWrapper = styled.div`
    overflow: auto;
    position: relative;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
`;

const DashboardPage: FC = () => {
    const { data } = useProState();
    const shouldShowProBanner = data && !isPaidSubscription(data.subscription);

    return (
        <>
            <DesktopDashboardHeader />
            <PageWrapper>
                <DashboardTableStyled />
                {shouldShowProBanner && (
                    <ProBannerWrapper>
                        <ProBanner />
                    </ProBannerWrapper>
                )}
            </PageWrapper>
        </>
    );
};

export default DashboardPage;
