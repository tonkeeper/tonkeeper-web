import { useTranslation } from '../../hooks/translation';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent
} from '../../components/desktop/DesktopViewLayout';
import { StakingOperationFormContent } from '../../components/staking/pages/StakingOperationFormContent';
import { StakingSource } from '../../hooks/analytics/staking';
import { StakingPageWrapper, ContentWrapper } from './StakingLayout';

interface DesktopStakingFormPageProps {
    poolAddress?: string;
    from?: StakingSource;
}

export const DesktopStakingFormPage = ({ poolAddress, from }: DesktopStakingFormPageProps) => {
    const { t } = useTranslation();

    return (
        <StakingPageWrapper mobileContentPaddingTop>
            <DesktopViewHeader borderBottom>
                <DesktopViewHeaderContent title={t('staking_title')} />
            </DesktopViewHeader>
            <ContentWrapper>
                <StakingOperationFormContent mode="stake" poolAddress={poolAddress} from={from} />
            </ContentWrapper>
        </StakingPageWrapper>
    );
};
