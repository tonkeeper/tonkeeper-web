import React, { FC } from 'react';
import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { useTranslation } from '../../../../hooks/translation';
import { HistoryCellActionGeneric, HistoryCellComment } from './HistoryCell';
import { EmptyIcon } from '../../../Icon';
import styled from 'styled-components';
import { HistoryGridCell } from './HistoryGrid';

const HistoryGridCellStyled = styled(HistoryGridCell)`
    grid-column: 3 / 5;
`;

export const UnknownDesktopAction: FC<{
    action: Action;
}> = ({ action }) => {
    const { t } = useTranslation();

    const isFailed = action.status === 'failed';

    return (
        <>
            <HistoryCellActionGeneric icon={<EmptyIcon color="iconPrimary" />} isFailed={isFailed}>
                {t('transactions_unknown')}
            </HistoryCellActionGeneric>
            <HistoryGridCellStyled>
                <HistoryCellComment comment={t('transactions_unknown_description')} />
            </HistoryGridCellStyled>
        </>
    );
};
