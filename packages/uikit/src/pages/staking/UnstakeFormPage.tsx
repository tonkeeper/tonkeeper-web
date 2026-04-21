import { useTranslation } from '../../hooks/translation';
import { StakingOperationFormContent } from '../../components/staking/pages/StakingOperationFormContent';
import { ContentWrapper } from './StakingLayout';
import { PageHeader } from '../../components/Header';

export const UnstakeFormPage = () => {
    const { t } = useTranslation();

    return (
        <>
            <PageHeader title={t('staking_unstake_title')} backButton />
            <ContentWrapper>
                <StakingOperationFormContent mode="unstake" />
            </ContentWrapper>
        </>
    );
};
