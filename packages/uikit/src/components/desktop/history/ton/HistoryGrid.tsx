import styled, { css } from 'styled-components';

export const HistoryGridCell = styled.div`
    height: 20px;
    padding: 0.5rem 0;

    ${p =>
        p.theme.proDisplayType === 'mobile' &&
        css`
            padding: 0.25rem 0;
        `}
`;

export const HistoryGridCellFillRow = styled(HistoryGridCell)`
    grid-column: 2 / 5;
`;
