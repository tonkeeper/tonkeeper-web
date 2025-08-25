import React, { FC } from 'react';
import { Action } from '@tonkeeper/core/dist/tonApiV2';
import {
    ActionRow,
    ErrorRow,
    HistoryCellAccount,
    HistoryCellActionGeneric,
    HistoryCellAmount,
    HistoryCellComment
} from './HistoryCell';
import styled from 'styled-components';
import { PurchaseIcon16 } from '../../../activity/ActivityIcons';
import { useTranslation } from '../../../../hooks/translation';

const PurchaseIcon = styled(PurchaseIcon16)`
    color: ${p => p.theme.iconPrimary};
`;

export const PurchaseDesktopAction: FC<{
    action: Action;
}> = ({ action }) => {
    const { purchase } = action;
    const { t } = useTranslation();

    if (!purchase) {
        return <ErrorRow />;
    }

    return (
        <>
            <HistoryCellActionGeneric icon={<PurchaseIcon />} isFailed={action.status === 'failed'}>
                {t('transaction_type_purchase')}
            </HistoryCellActionGeneric>
            {<HistoryCellAccount account={purchase.destination} />}
            <ActionRow>
                <HistoryCellComment
                    comment={t('transaction_type_purchase_description', {
                        invoice: purchase.invoiceId
                    })}
                />
                <HistoryCellAmount
                    amount={purchase.amount.value}
                    symbol={purchase.amount.tokenName}
                    decimals={purchase.amount.decimals}
                    isNegative
                    isFailed={action.status === 'failed'}
                />
            </ActionRow>
        </>
    );
};
