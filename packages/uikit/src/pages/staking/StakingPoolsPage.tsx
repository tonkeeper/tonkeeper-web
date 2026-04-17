import { useTranslation } from '../../hooks/translation';
import { PageHeader } from '../../components/Header';
import { StakingPoolsContent } from '../../components/staking/pages/StakingPoolsContent';

export const StakingPoolsPage = () => {
    const { t } = useTranslation();

    return (
        <>
            <PageHeader title={t('staking_title')} backButton />
            <StakingPoolsContent />
        </>
    );
};
