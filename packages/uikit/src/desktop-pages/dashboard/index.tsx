import { isPaidSubscription } from '@tonkeeper/core/dist/entries/pro';
import { FC } from 'react';
import styled from 'styled-components';
import { DashboardTable } from '../../components/dashboard/DashboardTable';
import { DesktopDashboardHeader } from '../../components/desktop/header/DesktopDashboardHeader';
import { desktopHeaderContainerHeight } from '../../components/desktop/header/DesktopHeaderElements';
import { ProBanner } from '../../components/pro/ProBanner';
import { useProState } from '../../state/pro';

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
    height: calc(100% - ${desktopHeaderContainerHeight});
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
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
