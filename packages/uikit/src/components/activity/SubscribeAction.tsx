import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import {
    ActivityIcon,
    SubscribeIcon,
    UnsubscribeIcon
} from '../../components/activity/ActivityIcons';
import { useWalletContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { ListBlock } from '../List';
import { ActionData } from './ActivityNotification';
import { ColumnLayout, ErrorAction, ListItemGrid } from './CommonAction';
import {
    ActionBeneficiaryDetails,
    ActionDate,
    ActionDetailsBlock,
    ActionExtraDetails,
    ActionTransactionDetails,
    ErrorActivityNotification,
    Title
} from './NotificationCommon';

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
    const wallet = useWalletContext();

    if (!unSubscribe) {
        return <ErrorAction />;
    }
    return (
        <ListItemGrid>
            <ActivityIcon>
                <UnsubscribeIcon />
            </ActivityIcon>
            <ColumnLayout
                title={t('transaction_type_unsubscription')}
                entry="-"
                address={
                    unSubscribe.beneficiary.name ??
                    toShortValue(formatAddress(unSubscribe.beneficiary.address, wallet.network))
                }
                date={date}
            />
        </ListItemGrid>
    );
};

export const SubscribeAction: FC<{ action: Action; date: string }> = ({ action, date }) => {
    const { t } = useTranslation();
    const { subscribe } = action;
    const wallet = useWalletContext();

    if (!subscribe) {
        return <ErrorAction />;
    }

    return (
        <ListItemGrid>
            <ActivityIcon>
                <SubscribeIcon />
            </ActivityIcon>
            <ColumnLayout
                title={t('transaction_type_subscription')}
                entry="-"
                address={
                    subscribe.beneficiary.name ??
                    toShortValue(formatAddress(subscribe.beneficiary.address, wallet.network))
                }
                date={date}
            />
        </ListItemGrid>
    );
};
