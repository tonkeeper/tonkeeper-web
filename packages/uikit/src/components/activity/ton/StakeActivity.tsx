import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
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
                entry={CryptoCurrency.TON}
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
                entry={CryptoCurrency.TON}
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

    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>
                <ReceiveIcon />
            </ActivityIcon>
            <ColumnLayout
                title={t('activityActionModal_withdrawal_request')}
                amount={
                    withdrawStakeRequest.amount ? (
                        <>+&thinsp;{format(withdrawStakeRequest.amount)}</>
                    ) : undefined
                }
                entry={withdrawStakeRequest.amount ? CryptoCurrency.TON : ''}
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
