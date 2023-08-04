import { AccountEvent, Action } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC, useCallback } from 'react';
import { Notification } from '../Notification';
import {
    AuctionBidActionDetails,
    JettonTransferActionNotification,
    TonTransferActionNotification
} from './ActivityActionDetails';
import { ContractDeployActionDetails } from './ContractDeployAction';
import { NftItemTransferActionDetails } from './NftActivity';
import { ErrorActivityNotification } from './NotificationCommon';
import { SubscribeActionDetails, UnSubscribeActionDetails } from './SubscribeAction';

export interface ActionData {
    isScam: boolean;
    action: Action;
    timestamp: number;
    event: AccountEvent;
}

const ActivityContent: FC<ActionData> = props => {
    switch (props.action.type) {
        case 'TonTransfer':
            return <TonTransferActionNotification {...props} />;
        case 'JettonTransfer':
            return <JettonTransferActionNotification {...props} />;
        case 'NftItemTransfer':
            return <NftItemTransferActionDetails {...props} />;
        case 'ContractDeploy':
            return <ContractDeployActionDetails {...props} />;
        case 'UnSubscribe':
            return <UnSubscribeActionDetails {...props} />;
        case 'Subscribe':
            return <SubscribeActionDetails {...props} />;
        case 'AuctionBid':
            return <AuctionBidActionDetails {...props} />;
        case 'Unknown':
            return <ErrorActivityNotification event={props.event} />;
        default: {
            console.log(props);
            return (
                <ErrorActivityNotification event={props.event}>
                    {props.action.type}
                </ErrorActivityNotification>
            );
        }
    }
};

export const ActivityNotification: FC<{
    value: ActionData | undefined;
    handleClose: () => void;
}> = ({ value, handleClose }) => {
    const Content = useCallback(() => {
        if (!value) return undefined;
        return (
            <ActivityContent
                isScam={value.isScam}
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
