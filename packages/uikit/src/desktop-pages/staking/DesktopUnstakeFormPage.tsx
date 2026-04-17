import { useTranslation } from '../../hooks/translation';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent
} from '../../components/desktop/DesktopViewLayout';
import { StakingOperationFormContent } from '../../components/staking/pages/StakingOperationFormContent';
import { StakingPageWrapper, ContentWrapper } from './StakingLayout';

export const DesktopUnstakeFormPage = () => {
    const { t } = useTranslation();

    return (
        <StakingPageWrapper mobileContentPaddingTop>
            <DesktopViewHeader borderBottom>
                <DesktopViewHeaderContent title={t('staking_unstake_title')} />
            </DesktopViewHeader>
            <ContentWrapper>
                <StakingOperationFormContent mode="unstake" />
            </ContentWrapper>
        </StakingPageWrapper>
    );
};
