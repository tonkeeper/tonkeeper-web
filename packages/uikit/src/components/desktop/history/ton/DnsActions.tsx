import React, { FC } from 'react';
import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { useTranslation } from '../../../../hooks/translation';
import {
    ActionRow,
    ErrorRow,
    HistoryCellAccount,
    HistoryCellActionGeneric,
    HistoryCellAmountText,
    HistoryCellComment
} from './HistoryCell';
import { ExitIcon } from '../../../Icon';

export const DomainRenewDesktopAction: FC<{
    action: Action;
}> = ({ action }) => {
    const { domainRenew } = action;
    const { t } = useTranslation();

    if (!domainRenew) {
        return <ErrorRow />;
    }

    const isFailed = action.status === 'failed';

    return (
        <>
            <HistoryCellActionGeneric icon={<ExitIcon color="iconPrimary" />} isFailed={isFailed}>
                {t('dns_renew_toast_success')}
            </HistoryCellActionGeneric>
            <HistoryCellAccount account={{ address: domainRenew.contractAddress }} />
            <ActionRow>
                <HistoryCellComment comment={domainRenew.domain} />
                <HistoryCellAmountText>-</HistoryCellAmountText>
            </ActionRow>
        </>
    );
};
