import React, { FC } from 'react';
import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { useTranslation } from '../../../../hooks/translation';
import {
    ActionRow,
    ErrorRow,
    HistoryCellAccount,
    HistoryCellActionGeneric,
    HistoryCellAmount,
    HistoryCellComment
} from './HistoryCell';
import { CoinsIcon, DoneIcon, ExitIcon } from '../../../Icon';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import styled from 'styled-components';
import { HistoryGridCell } from './HistoryGrid';

export const DepositStakeDesktopAction: FC<{
    action: Action;
}> = ({ action }) => {
    const { depositStake } = action;
    const { t } = useTranslation();

    if (!depositStake) {
        return <ErrorRow />;
    }

    const isFailed = action.status === 'failed';

    return (
        <>
            <HistoryCellActionGeneric icon={<CoinsIcon color="iconPrimary" />} isFailed={isFailed}>
                {t('staking_deposit')}
            </HistoryCellActionGeneric>
            <HistoryCellAccount account={depositStake.pool} />
            <ActionRow>
                <HistoryCellComment />
                <HistoryCellAmount
                    amount={depositStake.amount}
                    symbol={CryptoCurrency.TON}
                    decimals={9}
                    isFailed={isFailed}
                    isNegative
                />
            </ActionRow>
        </>
    );
};

export const WithdrawStakeDesktopAction: FC<{
    action: Action;
}> = ({ action }) => {
    const { withdrawStake } = action;
    const { t } = useTranslation();

    if (!withdrawStake) {
        return <ErrorRow />;
    }

    const isFailed = action.status === 'failed';

    return (
        <>
            <HistoryCellActionGeneric icon={<ExitIcon color="iconPrimary" />} isFailed={isFailed}>
                {t('staking_withdraw')}
            </HistoryCellActionGeneric>
            <HistoryCellAccount account={withdrawStake.pool} />
            <ActionRow>
                <HistoryCellComment />
                <HistoryCellAmount
                    amount={withdrawStake.amount}
                    symbol={CryptoCurrency.TON}
                    decimals={9}
                    isFailed={action.status === 'failed'}
                />
            </ActionRow>
        </>
    );
};

const DoneIconStyled = styled(DoneIcon)`
    color: ${p => p.theme.iconPrimary};
`;

export const WithdrawRequestStakeDesktopAction: FC<{
    action: Action;
}> = ({ action }) => {
    const { withdrawStakeRequest } = action;
    const { t } = useTranslation();

    if (!withdrawStakeRequest) {
        return <ErrorRow />;
    }

    const isFailed = action.status === 'failed';

    return (
        <>
            <HistoryCellActionGeneric icon={<DoneIconStyled />} isFailed={isFailed}>
                {t('activityActionModal_withdrawal_request')}
            </HistoryCellActionGeneric>
            <HistoryCellAccount account={withdrawStakeRequest.pool} />
            <ActionRow>
                <HistoryCellComment />
                {withdrawStakeRequest.amount ? (
                    <HistoryCellAmount
                        amount={withdrawStakeRequest.amount}
                        symbol={CryptoCurrency.TON}
                        decimals={9}
                        isFailed={action.status === 'failed'}
                    />
                ) : (
                    <HistoryGridCell />
                )}
            </ActionRow>
        </>
    );
};
