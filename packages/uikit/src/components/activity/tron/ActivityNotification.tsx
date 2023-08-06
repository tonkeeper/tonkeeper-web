import { TronAction, TronEvent } from '@tonkeeper/core/dist/tronApi';
import React, { FC, useCallback } from 'react';
import { Notification } from '../../Notification';
import { TronErrorActivityNotification } from '../NotificationCommon';
import {
    ContractDeployActionDetails,
    TronReceiveTRC20ActionNotification,
    TronSendTRC20ActionNotification
} from './ActivityActionDetails';

export interface TronActionData {
    action: TronAction;
    timestamp: number;
    event: TronEvent;
}

const ActivityContent: FC<TronActionData> = props => {
    switch (props.action.type) {
        case 'ReceiveTRC20':
            return <TronReceiveTRC20ActionNotification {...props} />;
        case 'SendTRC20':
            return <TronSendTRC20ActionNotification {...props} />;
        case 'ContractDeploy':
            return <ContractDeployActionDetails {...props} />;
        default: {
            console.log(props);
            return (
                <TronErrorActivityNotification event={props.event}>
                    {props.action.type}
                </TronErrorActivityNotification>
            );
        }
    }
};

export const TronActivityNotification: FC<{
    value: TronActionData | undefined;
    handleClose: () => void;
}> = ({ value, handleClose }) => {
    const Content = useCallback(() => {
        if (!value) return undefined;
        return (
            <ActivityContent
                action={value.action}
                timestamp={value.timestamp}
                event={value.event}
            />
        );
    }, [value, handleClose]);

    return (
        <Notification isOpen={!!value} handleClose={handleClose}>
            {Content}
        </Notification>
    );
};
