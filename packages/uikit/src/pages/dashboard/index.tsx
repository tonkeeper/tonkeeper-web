import { DashboardTable } from '../../components/dashboard/DashboardTable';
import { FC } from 'react';
import styled from 'styled-components';

const DashboardTableStyled = styled(DashboardTable)`
    margin-top: 20px;
`;

const DashboardPage: FC = () => {
    return <DashboardTableStyled />;
};

export default DashboardPage;
