import { AccountEvent, Action } from '@tonkeeper/core/dist/tonApiV2';
import { FC, useCallback } from 'react';
import { Notification } from '../../Notification';
import { ErrorActivityNotification } from '../NotificationCommon';
import {
    AuctionBidActionDetails,
    DomainRenewActionDetails,
    SmartContractExecActionDetails,
    TonTransferActionNotification
} from './ActivityActionDetails';
import { ContractDeployActionDetails } from './ContractDeployAction';
import {
    JettonBurnActionNotification,
    JettonMintActionNotification,
    JettonTransferActionNotification,
    SwapTokensActionDetails
} from './JettonNotifications';
import { NftItemTransferActionDetails, NftPurchaseActionDetails } from './NftActivity';
import {
    DepositStakeActionNotification,
    WithdrawRequestStakeActionNotification,
    WithdrawStakeActionNotification
} from './StakeNotifications';
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
        case 'DomainRenew':
            return <DomainRenewActionDetails {...props} />;
        case 'SmartContractExec':
            return <SmartContractExecActionDetails {...props} />;
        case 'JettonTransfer':
            return <JettonTransferActionNotification {...props} />;
        case 'JettonSwap':
            return <SwapTokensActionDetails {...props} />;
        case 'JettonMint':
            return <JettonMintActionNotification {...props} />;
        case 'JettonBurn':
            return <JettonBurnActionNotification {...props} />;
        case 'DepositStake':
            return <DepositStakeActionNotification {...props} />;
        case 'WithdrawStake':
            return <WithdrawStakeActionNotification {...props} />;
        case 'WithdrawStakeRequest':
            return <WithdrawRequestStakeActionNotification {...props} />;
        case 'NftPurchase':
            return <NftPurchaseActionDetails {...props} />;
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
