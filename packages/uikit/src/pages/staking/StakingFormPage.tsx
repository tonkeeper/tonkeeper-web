import { useTranslation } from '../../hooks/translation';
import { StakingOperationFormContent } from '../../components/staking/pages/StakingOperationFormContent';
import { ContentWrapper } from './StakingLayout';
import { PageHeader } from '../../components/Header';

interface StakingFormPageProps {
    poolAddress?: string;
}

export const StakingFormPage = ({ poolAddress }: StakingFormPageProps) => {
    const { t } = useTranslation();

    return (
        <>
            <PageHeader title={t('staking_title')} backButton />
            <ContentWrapper>
                <StakingOperationFormContent mode="stake" poolAddress={poolAddress} />
            </ContentWrapper>
        </>
    );
};
