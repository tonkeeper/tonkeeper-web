import React, { FC } from 'react';
import { Action, ActionTypeEnum } from '@tonkeeper/core/dist/tonApiV2';

import {
    ActionRow,
    HistoryCellAccount,
    HistoryCellActionGeneric,
    HistoryCellAmount,
    HistoryCellComment
} from './HistoryCell';
import styled, { css } from 'styled-components';
import {
    ExtensionChargeIcon,
    ExtensionSubscribedIcon,
    ExtensionUnsubscribedIcon
} from '../HistoryIcons';
import { useTranslation } from '../../../../hooks/translation';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';

export enum ExtensionActionTitles {
    SUBSCRIBED = 'subscription_created',
    UNSUBSCRIBED = 'subscription_cancelled',
    SUBSCRIPTION_CHARGE = 'subscription_paid'
}

const getActionDetails = (action: Action) => {
    if (action.type === ActionTypeEnum.UnSubscribe) {
        return {
            title: ExtensionActionTitles.UNSUBSCRIBED,
            description: 'future_charges_stopped',
            icon: <ExtensionUnsubscribedIconStyled />
        };
    }

    if (action.subscribe?.initial && action.subscribe?.amount === 0) {
        return {
            title: ExtensionActionTitles.SUBSCRIBED,
            description: 'subscription_start',
            icon: <ExtensionSubscribedIconStyled />
        };
    }

    return {
        title: ExtensionActionTitles.SUBSCRIPTION_CHARGE,
        description: 'recurring_payment',
        icon: <ExtensionChargeIconStyled />
    };
};

export const ExtensionDesktopActions: FC<{
    action: Action;
    isScam: boolean;
}> = ({ action, isScam }) => {
    const { t } = useTranslation();

    const amount = action.subscribe?.amount;
    const account = action.subscribe?.subscriber;

    const { title, description, icon } = getActionDetails(action);

    return (
        <>
            <HistoryCellActionGeneric
                icon={icon}
                isScam={isScam}
                isFailed={action.status === 'failed'}
            >
                {t(title)}
            </HistoryCellActionGeneric>

            {account ? <HistoryCellAccount account={account} /> : <div />}

            <ActionRow>
                <HistoryCellComment isScam={isScam} comment={t(description)} />
                {amount && !isScam ? (
                    <HistoryCellAmount
                        amount={amount}
                        symbol={CryptoCurrency.TON}
                        decimals={9}
                        isFailed={action.status === 'failed'}
                        isNegative
                    />
                ) : (
                    <div />
                )}
            </ActionRow>
        </>
    );
};

const baseIconStyle = css`
    color: ${p => p.theme.iconPrimary};
    width: 16px;
    height: 16px;
`;

const ExtensionChargeIconStyled = styled(ExtensionChargeIcon)`
    ${baseIconStyle}
`;

const ExtensionSubscribedIconStyled = styled(ExtensionSubscribedIcon)`
    ${baseIconStyle}
`;

const ExtensionUnsubscribedIconStyled = styled(ExtensionUnsubscribedIcon)`
    ${baseIconStyle}
`;
