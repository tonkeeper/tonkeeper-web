import { useTranslation } from '../../hooks/translation';
import { StakingOperationFormContent } from '../../components/staking/pages/StakingOperationFormContent';
import { ContentWrapper } from './StakingLayout';
import { PageHeader } from '../../components/Header';
import { StakingSource } from '../../hooks/analytics/staking';

interface StakingFormPageProps {
    poolAddress?: string;
    from?: StakingSource;
}

export const StakingFormPage = ({ poolAddress, from }: StakingFormPageProps) => {
    const { t } = useTranslation();

    return (
        <>
            <PageHeader title={t('staking_title')} backButton />
            <ContentWrapper>
                <StakingOperationFormContent mode="stake" poolAddress={poolAddress} from={from} />
            </ContentWrapper>
        </>
    );
};
