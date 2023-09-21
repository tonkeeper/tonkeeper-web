import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import {
    AccountEvent,
    ActionStatusEnum,
    DepositStakeAction,
    WithdrawStakeAction,
    WithdrawStakeRequestAction
} from '@tonkeeper/core/dist/tonApiV2';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import React, { FC } from 'react';
import { useFormatCoinValue } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import { useFormatFiat, useRate } from '../../../state/rates';
import { ListBlock } from '../../List';
import { Amount, FailedDetail } from '../ActivityDetailsLayout';
import {
    ActionDate,
    ActionDetailsBlock,
    ActionExtraDetails,
    ActionPoolDetails,
    ActionTransactionDetails,
    ErrorActivityNotification,
    Title
} from '../NotificationCommon';
import { ActionData } from './ActivityNotification';

const DepositStakeActionContent: FC<{
    depositStake: DepositStakeAction;
    timestamp: number;
    event: AccountEvent;
    isScam: boolean;
    status?: ActionStatusEnum;
}> = ({ depositStake, timestamp, event, status }) => {
    const { t } = useTranslation();
    const { data } = useRate(CryptoCurrency.TON);
    const format = useFormatCoinValue();
    const { fiatAmount } = useFormatFiat(data, formatDecimals(depositStake.amount));

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>{t('staking_deposit')}</Title>
                <Amount>
                    -&thinsp;{format(depositStake.amount)} {CryptoCurrency.TON}
                </Amount>
                <Amount>≈&thinsp;{fiatAmount}</Amount>
                <ActionDate kind="send" timestamp={timestamp} />
                <FailedDetail status={status} />
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionPoolDetails pool={depositStake.pool} />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const DepositStakeActionNotification: FC<ActionData> = ({
    action,
    timestamp,
    event,
    isScam
}) => {
    const { depositStake } = action;

    if (!depositStake) {
        return <ErrorActivityNotification event={event} />;
    } else {
        return (
            <DepositStakeActionContent
                depositStake={depositStake}
                timestamp={timestamp}
                event={event}
                isScam={isScam}
                status={action.status}
            />
        );
    }
};

const WithdrawStakeActionContent: FC<{
    withdrawStake: WithdrawStakeAction;
    timestamp: number;
    event: AccountEvent;
    isScam: boolean;
    status?: ActionStatusEnum;
}> = ({ withdrawStake, timestamp, event, status }) => {
    const { t } = useTranslation();
    const { data } = useRate(CryptoCurrency.TON);
    const format = useFormatCoinValue();
    const { fiatAmount } = useFormatFiat(data, formatDecimals(withdrawStake.amount));

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>{t('staking_withdraw')}</Title>
                <Amount>
                    +&thinsp;{format(withdrawStake.amount)} {CryptoCurrency.TON}
                </Amount>
                <Amount>≈&thinsp;{fiatAmount}</Amount>
                <ActionDate kind="send" timestamp={timestamp} />
                <FailedDetail status={status} />
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionPoolDetails pool={withdrawStake.pool} />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const WithdrawStakeActionNotification: FC<ActionData> = ({
    action,
    timestamp,
    event,
    isScam
}) => {
    const { withdrawStake } = action;

    if (!withdrawStake) {
        return <ErrorActivityNotification event={event} />;
    } else {
        return (
            <WithdrawStakeActionContent
                withdrawStake={withdrawStake}
                timestamp={timestamp}
                event={event}
                isScam={isScam}
                status={action.status}
            />
        );
    }
};

const WithdrawRequestStakeActionContent: FC<{
    withdrawStakeRequest: WithdrawStakeRequestAction;
    timestamp: number;
    event: AccountEvent;
    isScam: boolean;
    status?: ActionStatusEnum;
}> = ({ withdrawStakeRequest, timestamp, event, status }) => {
    const { t } = useTranslation();
    const { data } = useRate(CryptoCurrency.TON);
    const format = useFormatCoinValue();
    const { fiatAmount } = useFormatFiat(data, formatDecimals(withdrawStakeRequest.amount ?? 0));

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>{t('activityActionModal_withdrawal_request')}</Title>
                {withdrawStakeRequest.amount && (
                    <>
                        <Amount>
                            +&thinsp;{format(withdrawStakeRequest.amount)} {CryptoCurrency.TON}
                        </Amount>
                        <Amount>≈&thinsp;{fiatAmount}</Amount>
                    </>
                )}
                <ActionDate kind="send" timestamp={timestamp} />
                <FailedDetail status={status} />
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionPoolDetails pool={withdrawStakeRequest.pool} />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const WithdrawRequestStakeActionNotification: FC<ActionData> = ({
    action,
    timestamp,
    event,
    isScam
}) => {
    const { withdrawStakeRequest } = action;

    if (!withdrawStakeRequest) {
        return <ErrorActivityNotification event={event} />;
    } else {
        return (
            <WithdrawRequestStakeActionContent
                withdrawStakeRequest={withdrawStakeRequest}
                timestamp={timestamp}
                event={event}
                isScam={isScam}
                status={action.status}
            />
        );
    }
};
