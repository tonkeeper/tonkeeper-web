import { DashboardTable } from '../../components/dashboard/DashboardTable';
import { FC, useState } from 'react';
import styled from 'styled-components';
import { CategoriesModal } from '../../components/dashboard/CategoriesModal';
import { Button } from '../../components/fields/Button';
import { ProBanner } from '../../components/pro/ProBanner';
import { useTranslation } from '../../hooks/translation';

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

const ProBannerStyled = styled(ProBanner)`
    margin: 0 1rem;
    position: sticky;
    bottom: 1rem;
    left: 1rem;
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
    return (
        <PageWrapper>
            <DashboardTableStyled />
            <ButtonContainerStyled>
                <Button size="small" corner="2xSmall" onClick={() => setIsOpen(true)}>
                    {t('manage')}
                </Button>
            </ButtonContainerStyled>
            <ProBannerStyled />
            <CategoriesModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </PageWrapper>
    );
};

export default DashboardPage;
