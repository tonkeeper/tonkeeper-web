import { AccountEvent, Action } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC, useCallback } from 'react';
import { Notification } from '../../Notification';
import { ActionDetailsBlock, ErrorActivityNotification, Title } from '../NotificationCommon';
import {
    AuctionBidActionDetails,
    DomainRenewActionDetails,
    ExtraCurrencyTransferNotification,
    SmartContractExecActionDetails,
    TonTransferActionNotification
} from './TonActivityActionDetails';
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
import { TronHistoryItem } from '@tonkeeper/core/dist/tronApi';
import { assertUnreachableSoft } from '@tonkeeper/core/dist/utils/types';
import { useTranslation } from '../../../hooks/translation';
import { TronTransferActionNotification } from '../tron/TronActivityActionDetails';
import { Label2 } from '../../Text';

export interface ActionData {
    isScam: boolean;
    action: Action;
    timestamp: number;
    event: AccountEvent;
}

export interface ActivityNotificationDataTon {
    type: 'ton';
    isScam: boolean;
    action: Action;
    timestamp: number;
    event: AccountEvent;
}

export interface ActivityNotificationDataTron {
    type: 'tron';
    event: TronHistoryItem;
    timestamp: number;
}

export type ActivityNotificationData = ActivityNotificationDataTon | ActivityNotificationDataTron;

const ActivityContentTon: FC<ActivityNotificationDataTon> = props => {
    const { t } = useTranslation();

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
        case 'ExtraCurrencyTransfer':
            return <ExtraCurrencyTransferNotification {...props} />;
        case 'Unknown':
            return <ErrorActivityNotification event={props.event} />;
        default: {
            console.log(props);
            return (
                <ActionDetailsBlock event={props.event}>
                    <Title>
                        {props.action.simplePreview.name ??
                            t('txActions_signRaw_types_unknownTransaction')}
                    </Title>
                    {!!props.action.simplePreview.description && (
                        <Label2>{props.action.simplePreview.description}</Label2>
                    )}
                </ActionDetailsBlock>
            );
        }
    }
};

const ActivityContentTron: FC<ActivityNotificationDataTron> = props => {
    const { t } = useTranslation();
    switch (props.event.type) {
        case 'asset-transfer':
            return <TronTransferActionNotification {...props} />;
        default: {
            assertUnreachableSoft(props.event.type);
            return <>{t('txActions_signRaw_types_unknownTransaction')}</>;
        }
    }
};

export const ActivityNotification: FC<{
    value: ActivityNotificationData | undefined;
    handleClose: () => void;
}> = ({ value, handleClose }) => {
    const Content = useCallback(() => {
        if (!value) return undefined;

        if (value.type === 'tron') {
            return <ActivityContentTron {...value} />;
        } else {
            return <ActivityContentTon {...value} />;
        }
    }, [value, handleClose]);

    return (
        <Notification isOpen={!!value} handleClose={handleClose}>
            {Content}
        </Notification>
    );
};
