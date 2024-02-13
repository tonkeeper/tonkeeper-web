import styled from 'styled-components';
import { DASHBOARD_COLUMNS, DashboardRow } from './columns/DASHBOARD_COLUMNS';
import BigNumber from 'bignumber.js';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { Cells, Headings } from './columns/columns';
import { FC, Fragment } from 'react';

const TableStyled = styled.table`
    width: 100%;
    font-family: ${props => props.theme.fontMono};
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

const mockSelectedColumns = [
    DASHBOARD_COLUMNS.ADDRESS,
    DASHBOARD_COLUMNS.TOTAL,
    DASHBOARD_COLUMNS.BALANCE_TON,
    DASHBOARD_COLUMNS.STORAGE
] as const;

const mockDataSource: Pick<DashboardRow, (typeof mockSelectedColumns)[number]>[] = [
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000000',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000001',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000002',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000003',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000004',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000005',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000006',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000007',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000008',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000009',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000010',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000011',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000012',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000013',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000014',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000015',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000016',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    },
    {
        [DASHBOARD_COLUMNS.ADDRESS]: {
            addressRaw: '0:0000000000000000000000000000000000000000000000000000000000000017',
            network: Network.MAINNET
        },
        [DASHBOARD_COLUMNS.TOTAL]: new BigNumber(123),
        [DASHBOARD_COLUMNS.BALANCE_TON]: new BigNumber(111111111111),
        [DASHBOARD_COLUMNS.STORAGE]: 'keychain'
    }
];

export const DashboardTable: FC<{ className?: string }> = ({ className }) => {
    return (
        <TableStyled className={className}>
            <thead>
                <HeadingTrStyled>
                    {mockSelectedColumns.map(column => (
                        <Fragment key={column}>{Headings[column]}</Fragment>
                    ))}
                </HeadingTrStyled>
            </thead>
            <tbody>
                {mockDataSource.map(dataRow => (
                    <TrStyled key={dataRow[DASHBOARD_COLUMNS.ADDRESS].addressRaw}>
                        {mockSelectedColumns.map(column => (
                            <Fragment key={column}>
                                {Cells[column](dataRow[column] as never)}
                            </Fragment>
                        ))}
                    </TrStyled>
                ))}
            </tbody>
        </TableStyled>
    );
};
