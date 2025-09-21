import React, { FC, ReactNode } from 'react';
import { Action } from '@tonkeeper/core/dist/tonApiV2';

import {
    ActionRow,
    ErrorRow,
    HistoryCellAccount,
    HistoryCellActionGeneric,
    HistoryCellAmountContent,
    HistoryCellComment
} from './HistoryCell';
import styled, { css } from 'styled-components';
import { ContractDeployIcon } from '../../../activity/ActivityIcons';
import {
    ExtensionChargeIcon,
    ExtensionSubscribedIcon,
    ExtensionUnsubscribedIcon
} from '../HistoryIcons';

enum ExtensionSimpleNames {
    SUBSCRIBED = 'Subscribed',
    UNSUBSCRIBED = 'Unsubscribed',
    SUBSCRIPTION_CHARGE = 'Subscription Charge'
}

export const ExtensionDesktopActions: FC<{
    action: Action;
    isScam: boolean;
}> = ({ action, isScam }) => {
    const { simplePreview } = action;

    if (!simplePreview) {
        return <ErrorRow />;
    }

    const account = simplePreview.accounts[0];

    return (
        <>
            <HistoryCellActionGeneric
                icon={icons[simplePreview.name] ?? <SimplePreviewIcon />}
                isFailed={action.status === 'failed'}
                isScam={isScam}
            >
                {simplePreview.name}
            </HistoryCellActionGeneric>
            {account ? <HistoryCellAccount account={account} /> : <div />}
            <ActionRow>
                <HistoryCellComment isScam={isScam} comment={simplePreview.description} />
                {simplePreview.value && !isScam ? (
                    <HistoryCellAmountContent isFailed={action.status === 'failed'}>
                        {simplePreview.value}
                    </HistoryCellAmountContent>
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

const SimplePreviewIcon = styled(ContractDeployIcon)`
    ${baseIconStyle}
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

const icons: Record<string, ReactNode> = {
    [ExtensionSimpleNames.SUBSCRIBED]: <ExtensionSubscribedIconStyled />,
    [ExtensionSimpleNames.UNSUBSCRIBED]: <ExtensionUnsubscribedIconStyled />,
    [ExtensionSimpleNames.SUBSCRIPTION_CHARGE]: <ExtensionChargeIconStyled />
};
