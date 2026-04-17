import { useTranslation } from '../../hooks/translation';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent
} from '../../components/desktop/DesktopViewLayout';
import { StakingPoolsContent } from '../../components/staking/pages/StakingPoolsContent';
import { StakingPageWrapper } from './StakingLayout';

export const DesktopStakingPoolsPage = () => {
    const { t } = useTranslation();

    return (
        <StakingPageWrapper mobileContentPaddingTop>
            <DesktopViewHeader borderBottom>
                <DesktopViewHeaderContent title={t('staking_title')} />
            </DesktopViewHeader>
            <StakingPoolsContent />
        </StakingPageWrapper>
    );
};
