import styled, { css } from 'styled-components';
import { FC, useEffect, useRef, useState } from 'react';
import { Body2 } from '../Text';
import { useDashboardColumnsAsForm } from '../../state/dashboard/useDashboardColumns';
import { useDashboardData } from '../../state/dashboard/useDashboardData';
import { DashboardCellAddress, DashboardColumnType } from '@tonkeeper/core/dist/entries/dashboard';
import { Skeleton } from '../shared/Skeleton';
import { DashboardCell } from './columns/DashboardCell';
import { useAccountsState } from '../../state/wallet';

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
        padding: 16px 24px 8px 0;
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
        padding: 14px 24px 14px 0;
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

const ResizeHandleWrapper = styled.button<{ hidden?: boolean }>`
    width: 24px;
    height: 20px;
    position: absolute;
    top: calc(50% + 4px - 10px);
    right: 0;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;

    transition: opacity 0.15s ease-in-out;

    ${p =>
        p.hidden &&
        css`
            opacity: 0;
        `}
`;

const ResizeHandle = styled.div`
    background: ${p => p.theme.iconTertiary};
    width: 1px;
    height: 12px;
`;

const Th = styled.th<{ textAlign?: string }>`
    text-align: ${p => p.textAlign || 'start'};
    position: relative;
    box-sizing: border-box;
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
    const wallets = useAccountsState();
    const mainnetIds = wallets?.map(w => w!.id);

    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [hoverOnColumn, setHoverOnColumn] = useState<number | undefined>(undefined);
    const pressedColumn = useRef<{
        index: number;
        initialPageX: number;
        initialWidth: number;
    } | null>();
    const thRefs = useRef<(HTMLTableHeaderCellElement | null)[]>([]);

    const changeColWidth = (i: number, change: number) => {
        if (!pressedColumn.current) {
            return;
        }

        const initialWidth = pressedColumn.current!.initialWidth;

        const newWidth = initialWidth + change;

        thRefs.current[i]!.style.width = `${newWidth}px`;
    };

    useEffect(() => {
        const onMouseUp = () => {
            document.body.style.cursor = 'unset';
            setIsResizing(false);
            pressedColumn.current = undefined;
        };

        const onMouseMove = (e: MouseEvent) => {
            if (pressedColumn.current?.index !== undefined) {
                changeColWidth(
                    pressedColumn.current!.index,
                    e.pageX - pressedColumn.current.initialPageX
                );
            }
        };

        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mousemove', onMouseMove);
        return () => {
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mousemove', onMouseMove);
        };
    }, []);

    const shouldHighlightSeparator = (i: number) => {
        if (isResizing) {
            return pressedColumn.current && i === pressedColumn.current!.index;
        }

        return hoverOnColumn !== undefined && hoverOnColumn >= i && hoverOnColumn <= i + 1;
    };

    if (!columns) {
        return null;
    }

    const selectedColumns = columns.filter(c => c.isEnabled);

    return (
        <TableStyled className={className}>
            <thead>
                <HeadingTrStyled>
                    {selectedColumns.map((column, index) => (
                        <Th
                            key={column.id}
                            textAlign={isNumericColumn(column.type) ? 'right' : undefined}
                            ref={el => (thRefs.current[index] = el)}
                            onMouseLeave={() => {
                                setTimeout(
                                    () => setHoverOnColumn(i => (index === i ? undefined : i)),
                                    50
                                );
                            }}
                            onMouseEnter={() => setHoverOnColumn(index)}
                        >
                            <Body2>{column.name}</Body2>
                            {index !== selectedColumns.length - 1 && (
                                <ResizeHandleWrapper
                                    hidden={!shouldHighlightSeparator(index)}
                                    onMouseDown={e => {
                                        setIsResizing(true);
                                        document.body.style.cursor = 'col-resize';
                                        pressedColumn.current = {
                                            index,
                                            initialPageX: e.pageX,
                                            initialWidth: thRefs.current[index]?.offsetWidth || 0
                                        };
                                    }}
                                    onMouseEnter={() => setHoverOnColumn(index + 0.5)}
                                >
                                    <ResizeHandle />
                                </ResizeHandleWrapper>
                            )}
                        </Th>
                    ))}
                </HeadingTrStyled>
            </thead>
            <tbody>
                {dashboardData
                    ? dashboardData.map((dataRow, index) => (
                          <TrStyled key={index.toString()}>
                              {dataRow.map((cell, i) => (
                                  <Td
                                      key={
                                          (
                                              dataRow.find(
                                                  c => c.type === 'address'
                                              ) as DashboardCellAddress
                                          )?.raw || i.toString()
                                      }
                                      textAlign={isNumericColumn(cell.type) ? 'right' : undefined}
                                  >
                                      <DashboardCell {...cell} />
                                  </Td>
                              ))}
                          </TrStyled>
                      ))
                    : (mainnetIds || [1, 2, 3]).map(key => (
                          <TrStyled key={key}>
                              {selectedColumns.map((col, colIndex) => (
                                  <Td key={col.id}>
                                      <Skeleton
                                          width="100px"
                                          margin={
                                              isNumericColumn(col.type) ||
                                              colIndex === selectedColumns.length - 1
                                                  ? '0 0 0 auto'
                                                  : '0'
                                          }
                                      />
                                  </Td>
                              ))}
                          </TrStyled>
                      ))}
            </tbody>
        </TableStyled>
    );
};
