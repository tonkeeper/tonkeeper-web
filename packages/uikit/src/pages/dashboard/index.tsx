import { DashboardTable } from '../../components/dashboard/DashboardTable';
import { FC, useState } from 'react';
import styled from 'styled-components';
import { CategoriesModal } from '../../components/dashboard/CategoriesModal';

const DashboardTableStyled = styled(DashboardTable)`
    margin-top: 20px;
`;

const DashboardPage: FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div>
            <button onClick={() => setIsOpen(true)}>Open modal</button>
            <DashboardTableStyled />
            <CategoriesModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
    );
};

export default DashboardPage;
