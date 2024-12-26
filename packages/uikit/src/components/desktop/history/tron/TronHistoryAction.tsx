import { FC } from 'react';

import { TronTransferDesktopAction } from './TronTransferDesktopAction';

import { Body2 } from '../../../Text';
import { TronHistoryItem } from '@tonkeeper/core/dist/tronApi';
import { assertUnreachableSoft } from '@tonkeeper/core/dist/utils/types';
import { useTranslation } from '../../../../hooks/translation';
import { HistoryGridCellFillRow } from '../ton/HistoryGrid';

export const TronHistoryAction: FC<{
    action: TronHistoryItem;
}> = ({ action }) => {
    const { t } = useTranslation();
    switch (action.type) {
        case 'asset-transfer':
            return <TronTransferDesktopAction action={action} />;
        default: {
            assertUnreachableSoft(action.type);
            return (
                <>
                    <HistoryGridCellFillRow>
                        <Body2>{t('unknown_operation')}</Body2>
                    </HistoryGridCellFillRow>
                </>
            );
        }
    }
};
