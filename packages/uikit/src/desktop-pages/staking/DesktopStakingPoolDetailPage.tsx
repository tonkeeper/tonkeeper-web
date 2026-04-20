import { useTheme } from 'styled-components';
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
    const { proDisplayType } = useTheme();
    return (
        <StakingPageWrapper mobileContentPaddingTop>
            <StakingPoolDetailContent
                poolAddress={poolAddress}
                renderHeader={({ title, hasMultipleStakingPositions }) => (
                    <DesktopViewHeader
                        backButton={hasMultipleStakingPositions || proDisplayType === 'mobile'}
                        borderBottom
                    >
                        <DesktopViewHeaderContent title={title} />
                    </DesktopViewHeader>
                )}
            />
        </StakingPageWrapper>
    );
};
