import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import { useTranslation } from '../../../hooks/translation';
import { ListBlock } from '../../List';
import { FailedDetail } from '../ActivityDetailsLayout';
import { ActivityIcon, SubscribeIcon, UnsubscribeIcon } from '../ActivityIcons';
import { ColumnLayout, ErrorAction, ListItemGrid } from '../CommonAction';
import {
    ActionBeneficiaryDetails,
    ActionDate,
    ActionDetailsBlock,
    ActionExtraDetails,
    ActionTransactionDetails,
    ErrorActivityNotification,
    Title
} from '../NotificationCommon';
import { ActionData } from './ActivityNotification';
import { useActiveTonNetwork } from '../../../state/wallet';

export const UnSubscribeActionDetails: FC<ActionData> = ({ action, timestamp, event }) => {
    const { t } = useTranslation();
    const { unSubscribe } = action;

    if (!unSubscribe) {
        return <ErrorActivityNotification event={event} />;
    }

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>{t('transaction_type_unsubscription')}</Title>
                <ActionDate kind="send" timestamp={timestamp} />
                <FailedDetail status={action.status} />
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionBeneficiaryDetails beneficiary={unSubscribe.beneficiary} />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const SubscribeActionDetails: FC<ActionData> = ({ action, timestamp, event }) => {
    const { t } = useTranslation();
    const { subscribe } = action;

    if (!subscribe) {
        return <ErrorActivityNotification event={event} />;
    }

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>{t('transaction_type_subscription')}</Title>
                <ActionDate kind="send" timestamp={timestamp} />
                <FailedDetail status={action.status} />
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionBeneficiaryDetails beneficiary={subscribe.beneficiary} />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const UnSubscribeAction: FC<{ action: Action; date: string }> = ({ action, date }) => {
    const { t } = useTranslation();
    const { unSubscribe } = action;
    const network = useActiveTonNetwork();

    if (!unSubscribe) {
        return <ErrorAction />;
    }
    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>
                <UnsubscribeIcon />
            </ActivityIcon>
            <ColumnLayout
                title={t('transaction_type_unsubscription')}
                entry="-"
                address={
                    unSubscribe.beneficiary.name ??
                    toShortValue(formatAddress(unSubscribe.beneficiary.address, network))
                }
                date={date}
            />
        </ListItemGrid>
    );
};

export const SubscribeAction: FC<{ action: Action; date: string }> = ({ action, date }) => {
    const { t } = useTranslation();
    const { subscribe } = action;
    const network = useActiveTonNetwork();

    if (!subscribe) {
        return <ErrorAction />;
    }

    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>
                <SubscribeIcon />
            </ActivityIcon>
            <ColumnLayout
                title={t('transaction_type_subscription')}
                entry="-"
                address={
                    subscribe.beneficiary.name ??
                    toShortValue(formatAddress(subscribe.beneficiary.address, network))
                }
                date={date}
            />
        </ListItemGrid>
    );
};
