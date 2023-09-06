import { ReceiveTRC20Action, SendTRC20Action, TronEvent } from '@tonkeeper/core/dist/tronApi';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import React, { FC, useMemo } from 'react';
import { useTranslation } from '../../../hooks/translation';
import { useFormatFiat, useRate } from '../../../state/rates';
import { ListBlock } from '../../List';
import { ActivityDetailsHeader } from '../ActivityDetailsLayout';
import {
    ActionDate,
    ActionDeployerAddress,
    ActionRecipientAddress,
    ActionSenderAddress,
    ActionTransactionDetails,
    ActionTronFeeDetails,
    Title,
    TronActionDetailsBlock,
    TronErrorActivityNotification
} from '../NotificationCommon';
import { TronActionData } from './ActivityNotification';

const TronSendTRC20ActionContent: FC<{
    sendTRC20: SendTRC20Action;
    timestamp: number;
    event: TronEvent;
}> = ({ sendTRC20, timestamp, event }) => {
    const amount = useMemo(
        () => formatDecimals(sendTRC20.amount, sendTRC20.token.decimals),
        [sendTRC20]
    );
    const { data } = useRate(sendTRC20.token.symbol);
    const { fiatAmount } = useFormatFiat(data, amount);

    return (
        <TronActionDetailsBlock event={event}>
            <ActivityDetailsHeader
                amount={sendTRC20.amount}
                decimals={sendTRC20.token.decimals}
                symbol={sendTRC20.token.symbol}
                total={fiatAmount}
                timestamp={timestamp}
                kind="send"
            />
            <ListBlock margin={false} fullWidth>
                <ActionRecipientAddress address={sendTRC20.recipient} />
                <ActionTransactionDetails eventId={event.txHash} />
                {event.fees && <ActionTronFeeDetails fees={event.fees} />}
            </ListBlock>
        </TronActionDetailsBlock>
    );
};

export const TronSendTRC20ActionNotification: FC<TronActionData> = ({
    action,
    timestamp,
    event
}) => {
    const { sendTRC20 } = action;
    if (!sendTRC20) {
        return <TronErrorActivityNotification event={event} />;
    }
    return <TronSendTRC20ActionContent sendTRC20={sendTRC20} event={event} timestamp={timestamp} />;
};

const TronReceiveTRC20ActionContent: FC<{
    receiveTRC20: ReceiveTRC20Action;
    timestamp: number;
    event: TronEvent;
}> = ({ receiveTRC20, timestamp, event }) => {
    const amount = useMemo(
        () => formatDecimals(receiveTRC20.amount, receiveTRC20.token.decimals),
        [receiveTRC20]
    );
    const { data } = useRate(receiveTRC20.token.symbol);
    const { fiatAmount } = useFormatFiat(data, amount);
    return (
        <TronActionDetailsBlock event={event}>
            <ActivityDetailsHeader
                amount={receiveTRC20.amount}
                decimals={receiveTRC20.token.decimals}
                symbol={receiveTRC20.token.symbol}
                total={fiatAmount}
                timestamp={timestamp}
                kind="received"
            />
            <ListBlock margin={false} fullWidth>
                <ActionSenderAddress address={receiveTRC20.sender} />
                <ActionTransactionDetails eventId={event.txHash} />
            </ListBlock>
        </TronActionDetailsBlock>
    );
};

export const TronReceiveTRC20ActionNotification: FC<TronActionData> = ({
    action,
    timestamp,
    event
}) => {
    const { receiveTRC20 } = action;
    if (!receiveTRC20) {
        return <TronErrorActivityNotification event={event} />;
    }
    return (
        <TronReceiveTRC20ActionContent
            receiveTRC20={receiveTRC20}
            event={event}
            timestamp={timestamp}
        />
    );
};

export const ContractDeployActionDetails: FC<TronActionData> = ({ action, timestamp, event }) => {
    const { t } = useTranslation();
    const { contractDeploy } = action;

    if (!contractDeploy) {
        return <TronErrorActivityNotification event={event} />;
    }

    return (
        <TronActionDetailsBlock event={event}>
            <div>
                <Title>{t('transaction_type_wallet_initialized')}</Title>
                <ActionDate kind="send" timestamp={timestamp} />
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionDeployerAddress address={contractDeploy.ownerAddress} />
                <ActionTransactionDetails eventId={event.txHash} />
                {event.fees && <ActionTronFeeDetails fees={event.fees} />}
            </ListBlock>
        </TronActionDetailsBlock>
    );
};
