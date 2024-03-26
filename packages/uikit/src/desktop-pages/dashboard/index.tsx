import { DashboardTable } from '../../components/dashboard/DashboardTable';
import { FC, useState } from 'react';
import styled from 'styled-components';
import { CategoriesModal } from '../../components/dashboard/CategoriesModal';
import { Button } from '../../components/fields/Button';
import { ProBanner } from '../../components/pro/ProBanner';
import { useTranslation } from '../../hooks/translation';
import { useProState } from '../../state/pro';
import { isPaidSubscription } from '@tonkeeper/core/dist/entries/pro';

const DashboardTableStyled = styled(DashboardTable)``;

const ButtonContainerStyled = styled.div`
    padding: 1rem 1rem 2rem;
    flex: 1;
    position: sticky;
    left: 0;

    > button {
        margin-left: auto;
    }
`;

const ProBannerWrapper = styled.div`
    padding: 1rem;
    position: sticky;
    bottom: 0;
    left: 0;
    background: ${p => p.theme.gradientBackgroundBottom};
`;

const PageWrapper = styled.div`
    overflow: auto;
    position: relative;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
`;

const DashboardPage: FC = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const { data } = useProState();
    const shouldShowProBanner = data && !isPaidSubscription(data.subscription);

    return (
        <PageWrapper>
            <DashboardTableStyled />
            <ButtonContainerStyled>
                <Button size="small" corner="2xSmall" onClick={() => setIsOpen(true)}>
                    {t('manage')}
                </Button>
            </ButtonContainerStyled>
            {shouldShowProBanner && (
                <ProBannerWrapper>
                    <ProBanner />
                </ProBannerWrapper>
            )}
            <CategoriesModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </PageWrapper>
    );
};

export default DashboardPage;
