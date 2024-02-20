import { DashboardTable } from '../../components/dashboard/DashboardTable';
import { FC, useState } from 'react';
import styled from 'styled-components';
import { CategoriesModal } from '../../components/dashboard/CategoriesModal';
import { Button } from '../../components/fields/Button';
import { ProBanner } from '../../components/pro/ProBanner';

const DashboardTableStyled = styled(DashboardTable)``;

const ButtonContainerStyled = styled.div`
    padding: 1rem 1rem 2rem;
    flex: 1;

    > button {
        margin-left: auto;
    }
`;

const ProBannerStyled = styled(ProBanner)`
    margin: 0 1rem;
    position: sticky;
    bottom: 1rem;
`;

const PageWrapper = styled.div`
    position: relative;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
`;

const DashboardPage: FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <PageWrapper>
            <DashboardTableStyled />
            <ButtonContainerStyled>
                <Button size="small" corner="2xSmall" onClick={() => setIsOpen(true)}>
                    Manage
                </Button>
            </ButtonContainerStyled>
            <ProBannerStyled />
            <CategoriesModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </PageWrapper>
    );
};

export default DashboardPage;
