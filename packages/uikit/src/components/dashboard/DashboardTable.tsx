import styled from 'styled-components';
import { FC } from 'react';
import { Body2 } from '../Text';
import { useDashboardColumnsAsForm } from '../../hooks/dashboard/useDashboardColumns';
import { useDashboardData } from '../../hooks/dashboard/useDashboardData';
import { DashboardCellAddress } from '../../hooks/dashboard/dashboard-column';
import { DashboardCell } from './columns/DashboardCell';

const TableStyled = styled.table`
    width: 100%;
    font-family: ${props => props.theme.fontMono};
    border-collapse: collapse;
`;

const HeadingTrStyled = styled.tr`
    > th {
        position: sticky;
        top: 0;
        background: ${props => props.theme.backgroundPage};
        z-index: 3;
        text-align: left;
        padding: 8px 12px;
        border-bottom: 1px solid ${props => props.theme.separatorCommon};
        color: ${props => props.theme.textSecondary};

        &:first-child {
            text-align: left !important;
            padding-left: 16px;
        }

        &:last-child {
            text-align: right !important;
            padding-right: 16px;
        }
    }
`;

const TrStyled = styled.tr`
    > td {
        padding: 14px 12px;
        border-bottom: 1px solid ${props => props.theme.separatorCommon};

        &:first-child {
            text-align: left !important;
            padding-left: 16px;
        }

        &:last-child {
            text-align: right !important;
            padding-right: 16px;
        }
    }
`;

export const DashboardTable: FC<{ className?: string }> = ({ className }) => {
    const { data: columns } = useDashboardColumnsAsForm();
    const { data: dashboardData } = useDashboardData();

    if (!columns || !dashboardData) {
        return null;
    }

    const selectedColumns = columns.filter(c => c.isEnabled);

    return (
        <TableStyled className={className}>
            <thead>
                <HeadingTrStyled>
                    {selectedColumns.map(column => (
                        <th key={column.id}>
                            <Body2>{column.name}</Body2>
                        </th>
                    ))}
                </HeadingTrStyled>
            </thead>
            <tbody>
                {dashboardData.map((dataRow, index) => (
                    <TrStyled
                        key={
                            (dataRow.find(c => c.type === 'address') as DashboardCellAddress)
                                ?.raw || '' + index.toString()
                        }
                    >
                        {dataRow.map((cell, i) => (
                            <td key={i}>
                                <DashboardCell {...cell} />
                            </td>
                        ))}
                    </TrStyled>
                ))}
            </tbody>
        </TableStyled>
    );
};
