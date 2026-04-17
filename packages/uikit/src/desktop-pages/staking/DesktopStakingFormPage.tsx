import { useTranslation } from '../../hooks/translation';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent
} from '../../components/desktop/DesktopViewLayout';
import { StakingOperationFormContent } from '../../components/staking/pages/StakingOperationFormContent';
import { StakingPageWrapper, ContentWrapper } from './StakingLayout';

interface DesktopStakingFormPageProps {
    poolAddress?: string;
}

export const DesktopStakingFormPage = ({ poolAddress }: DesktopStakingFormPageProps) => {
    const { t } = useTranslation();

    return (
        <StakingPageWrapper mobileContentPaddingTop>
            <DesktopViewHeader borderBottom>
                <DesktopViewHeaderContent title={t('staking_title')} />
            </DesktopViewHeader>
            <ContentWrapper>
                <StakingOperationFormContent mode="stake" poolAddress={poolAddress} />
            </ContentWrapper>
        </StakingPageWrapper>
    );
};
