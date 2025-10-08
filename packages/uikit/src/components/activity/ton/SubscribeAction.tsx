import { Action, ActionTypeEnum } from '@tonkeeper/core/dist/tonApiV2';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import { useTranslation } from '../../../hooks/translation';
import { ListBlock } from '../../List';
import { FailedDetail } from '../ActivityDetailsLayout';
import {
    ActivityIcon,
    SubscribeIcon,
    SubscriptionChargeIcon,
    UnsubscribeIcon
} from '../ActivityIcons';
import { ColumnLayout, ErrorAction, ListItemGrid, toAddressTextValue } from '../CommonAction';
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
import { ExtensionActionTitles } from '../../desktop/history/ton/ExtensionDesktopActions';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

const getActionDetails = (action: Action) => {
    if (action.type === ActionTypeEnum.UnSubscribe) {
        return {
            title: ExtensionActionTitles.UNSUBSCRIBED,
            icon: <UnsubscribeIcon />
        };
    }

    if (action.subscribe?.initial && action.subscribe?.amount === 0) {
        return {
            title: ExtensionActionTitles.SUBSCRIBED,
            icon: <SubscribeIcon />
        };
    }

    return {
        title: ExtensionActionTitles.SUBSCRIPTION_CHARGE,
        icon: <SubscriptionChargeIcon />
    };
};

export const UnSubscribeActionDetails: FC<ActionData> = ({ action, timestamp, event }) => {
    const { t } = useTranslation();
    const { unSubscribe } = action;

    if (!unSubscribe) {
        return <ErrorActivityNotification event={event} />;
    }

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>{t(ExtensionActionTitles.UNSUBSCRIBED)}</Title>
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

    const { title } = getActionDetails(action);

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>{t(title)}</Title>
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

    const { title, icon } = getActionDetails(action);

    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>{icon}</ActivityIcon>
            <ColumnLayout
                title={t(title)}
                entry="-"
                address={toAddressTextValue(
                    unSubscribe.beneficiary.name,
                    formatAddress(unSubscribe.beneficiary.address, network)
                )}
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

    const amount = action.subscribe?.amount;
    const { title, icon } = getActionDetails(action);

    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>{icon}</ActivityIcon>
            <ColumnLayout
                title={t(title)}
                entry={
                    amount
                        ? `- ${new AssetAmount({
                              asset: TON_ASSET,
                              weiAmount: amount
                          }).toStringAssetAbsoluteRelativeAmount()}`
                        : ''
                }
                address={
                    subscribe.beneficiary.name ??
                    formatAddress(subscribe.beneficiary.address, network)
                }
                date={date}
            />
        </ListItemGrid>
    );
};
