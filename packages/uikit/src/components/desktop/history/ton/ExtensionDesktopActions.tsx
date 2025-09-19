import React, { FC } from 'react';
import { Action, ActionTypeEnum } from '@tonkeeper/core/dist/tonApiV2';
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
import { ExtensionChargeIcon, ExtensionUnsubscribedIcon } from '../HistoryIcons';

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

const ExtensionUnsubscribedIconStyled = styled(ExtensionUnsubscribedIcon)`
    ${baseIconStyle}
`;

const getIcon = (type: ActionTypeEnum) => {
    switch (type) {
        case ActionTypeEnum.Subscribe:
            return <ExtensionChargeIconStyled />;
        case ActionTypeEnum.UnSubscribe:
            return <ExtensionUnsubscribedIconStyled />;
        default:
            return <SimplePreviewIcon />;
    }
};

export const ExtensionDesktopActions: FC<{
    action: Action;
    isScam: boolean;
}> = ({ action, isScam }) => {
    const { type, simplePreview } = action;

    if (!simplePreview) {
        return <ErrorRow />;
    }

    const account = simplePreview.accounts[0];

    return (
        <>
            <HistoryCellActionGeneric
                icon={getIcon(type)}
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
