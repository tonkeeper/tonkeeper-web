import {
    DesktopViewHeader,
    DesktopViewHeaderContent
} from '../../components/desktop/DesktopViewLayout';
import { StakingPoolDetailContent } from '../../components/staking/pages/StakingPoolDetailContent';
import { StakingPageWrapper } from './StakingLayout';

interface DesktopStakingPoolDetailPageProps {
    poolAddress?: string;
}

export const DesktopStakingPoolDetailPage = ({
    poolAddress
}: DesktopStakingPoolDetailPageProps) => {
    return (
        <StakingPageWrapper mobileContentPaddingTop>
            <StakingPoolDetailContent
                poolAddress={poolAddress}
                renderHeader={({ title, hasMultipleStakingPositions }) => (
                    <DesktopViewHeader backButton={hasMultipleStakingPositions} borderBottom>
                        <DesktopViewHeaderContent title={title} />
                    </DesktopViewHeader>
                )}
            />
        </StakingPageWrapper>
    );
};
