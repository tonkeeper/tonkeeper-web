import { PageHeader } from '../../components/Header';
import { StakingPoolDetailContent } from '../../components/staking/pages/StakingPoolDetailContent';
import { StakingPageWrapper } from './StakingLayout';

interface StakingPoolDetailPageProps {
    poolAddress?: string;
}

export const StakingPoolDetailPage = ({ poolAddress }: StakingPoolDetailPageProps) => {
    return (
        <StakingPageWrapper mobileContentPaddingTop>
            <StakingPoolDetailContent
                poolAddress={poolAddress}
                renderHeader={({ title }) => <PageHeader title={title} backButton />}
            />
        </StakingPageWrapper>
    );
};
