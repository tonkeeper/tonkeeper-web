import styled from 'styled-components';
import { FC } from 'react';
import { Body2 } from '../Text';
import { useDashboardColumnsAsForm } from '../../hooks/dashboard/useDashboardColumns';
import { useDashboardData } from '../../hooks/dashboard/useDashboardData';
import { DashboardCellAddress, DashboardColumnType } from '../../hooks/dashboard/dashboard-column';
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
        padding: 16px 12px 8px;
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
        white-space: nowrap;

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

const Th = styled.th<{ textAlign?: string }>`
    text-align: ${p => p.textAlign || 'start'};
`;

const Td = styled.td<{ textAlign?: string }>`
    text-align: ${p => p.textAlign || 'start'};
`;

const isNumericColumn = (columnType: DashboardColumnType): boolean => {
    return (
        columnType === 'numeric' || columnType === 'numeric_fiat' || columnType === 'numeric_crypto'
    );
};

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
                        <Th
                            key={column.id}
                            textAlign={isNumericColumn(column.type) ? 'right' : undefined}
                        >
                            <Body2>{column.name}</Body2>
                        </Th>
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
                            <Td
                                key={i}
                                textAlign={isNumericColumn(cell.type) ? 'right' : undefined}
                            >
                                <DashboardCell {...cell} />
                            </Td>
                        ))}
                    </TrStyled>
                ))}
            </tbody>
        </TableStyled>
    );
};
