import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import { useFormatCoinValue } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import { FailedNote } from '../ActivityActionLayout';
import { ActivityIcon, ReceiveIcon, SentIcon } from '../ActivityIcons';
import { ColumnLayout, ErrorAction, ListItemGrid, toAddressTextValue } from '../CommonAction';
import { useActiveTonNetwork } from '../../../state/wallet';

export const DepositStakeAction: FC<{
    action: Action;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();
    const { depositStake } = action;
    const network = useActiveTonNetwork();
    const format = useFormatCoinValue();

    if (!depositStake) {
        return <ErrorAction />;
    }

    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>
                <SentIcon />
            </ActivityIcon>
            <ColumnLayout
                title={t('staking_deposit')}
                amount={<>-&thinsp;{format(depositStake.amount)}</>}
                entry={BRAND_CONFIG.coinSymbolWithEx}
                address={toAddressTextValue(
                    depositStake.pool.name,
                    formatAddress(depositStake.pool.address, network, true)
                )}
                date={date}
            />
            <FailedNote status={action.status} />
        </ListItemGrid>
    );
};

export const WithdrawStakeAction: FC<{
    action: Action;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();
    const { withdrawStake } = action;
    const network = useActiveTonNetwork();
    const format = useFormatCoinValue();
    if (!withdrawStake) {
        return <ErrorAction />;
    }
    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>
                <ReceiveIcon />
            </ActivityIcon>
            <ColumnLayout
                title={t('staking_withdraw')}
                amount={<>+&thinsp;{format(withdrawStake.amount)}</>}
                entry={BRAND_CONFIG.coinSymbolWithEx}
                green
                address={toAddressTextValue(
                    withdrawStake.pool.name,
                    formatAddress(withdrawStake.pool.address, network, true)
                )}
                date={date}
            />
            <FailedNote status={action.status} />
        </ListItemGrid>
    );
};

export const WithdrawRequestStakeAction: FC<{
    action: Action;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();
    const { withdrawStakeRequest } = action;
    const network = useActiveTonNetwork();
    const format = useFormatCoinValue();
    if (!withdrawStakeRequest) {
        return <ErrorAction />;
    }

    const stakeMeta = withdrawStakeRequest.stakeMeta;
    let amountNode: React.ReactNode | undefined;
    let entry = '';
    if (stakeMeta) {
        amountNode = <>-&thinsp;{format(stakeMeta.value, stakeMeta.decimals)}</>;
        entry = stakeMeta.tokenName;
    } else if (withdrawStakeRequest.amount) {
        amountNode = <>+&thinsp;{format(withdrawStakeRequest.amount)}</>;
        entry = BRAND_CONFIG.coinSymbolWithEx;
    }

    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>
                <ReceiveIcon />
            </ActivityIcon>
            <ColumnLayout
                title={t('activityActionModal_withdrawal_request')}
                amount={amountNode}
                entry={entry}
                address={toAddressTextValue(
                    withdrawStakeRequest.pool.name,
                    formatAddress(withdrawStakeRequest.pool.address, network, true)
                )}
                date={date}
            />
            <FailedNote status={action.status} />
        </ListItemGrid>
    );
};
