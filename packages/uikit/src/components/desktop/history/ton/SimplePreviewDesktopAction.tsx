import React, { FC } from 'react';
import { Action } from '@tonkeeper/core/dist/tonApiV2';
import {
    ActionRow,
    ErrorRow,
    HistoryCellAccount,
    HistoryCellActionGeneric,
    HistoryCellAmountContent,
    HistoryCellComment
} from './HistoryCell';
import styled from 'styled-components';
import { ContractDeployIcon } from '../../../activity/ActivityIcons';

const SimplePreviewIcon = styled(ContractDeployIcon)`
    color: ${p => p.theme.iconPrimary};
    width: 16px;
    height: 16px;
`;

export const SimplePreviewDesktopAction: FC<{
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
                icon={<SimplePreviewIcon />}
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
