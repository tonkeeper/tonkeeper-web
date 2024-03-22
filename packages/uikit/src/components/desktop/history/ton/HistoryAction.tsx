import { FC } from 'react';
import { Action } from '@tonkeeper/core/dist/tonApiV2';

import { TonTransferDesktopAction } from './TonTransferDesktopAction';
import { useTranslation } from '../../../../hooks/translation';
import { NftPurchaseDesktopAction, NftTransferDesktopAction } from './NftDesktopAction';
import {
    JettonBurnDesktopAction,
    JettonMintDesktopAction,
    JettonSwapDesktopAction,
    JettonTransferDesktopAction
} from './JettonDesktopActivity';
import { ContractDeployDesktopAction } from "./ContractDeployAction";

export const HistoryAction: FC<{
    action: Action;
    date: string;
    isScam: boolean;
}> = ({ action, isScam, date }) => {
    const { t } = useTranslation();

    switch (action.type) {
        case 'TonTransfer':
            return <TonTransferDesktopAction action={action} isScam={isScam} />;
        case 'NftItemTransfer':
            return <NftTransferDesktopAction action={action} isScam={isScam} />;
        case 'NftPurchase':
            return <NftPurchaseDesktopAction action={action} />;
        case 'ContractDeploy':
            return <ContractDeployDesktopAction action={action} />;
        /*
        case 'UnSubscribe':
            return <UnSubscribeAction action={action} date={date} />;
        case 'Subscribe':
            return <SubscribeAction action={action} date={date} />;
        case 'AuctionBid':
            return <AuctionBidAction action={action} date={date} />;
        case 'SmartContractExec':
            return <SmartContractExecAction action={action} date={date} />; */
        case 'JettonTransfer':
            return <JettonTransferDesktopAction action={action} isScam={isScam} />;
        case 'JettonSwap':
            return <JettonSwapDesktopAction action={action} />;
        case 'JettonBurn':
            return <JettonBurnDesktopAction action={action} />;
        case 'JettonMint':
            return <JettonMintDesktopAction action={action} />;
        /*   case 'DepositStake':
            return <DepositStakeAction action={action} date={date} />;
        case 'WithdrawStake':
            return <WithdrawStakeAction action={action} date={date} />;
        case 'WithdrawStakeRequest':
            return <WithdrawRequestStakeAction action={action} date={date} />;
        case 'DomainRenew':
            return <DomainRenewAction action={action} date={date} />;
        case 'Unknown':
            return <ErrorAction>{t('txActions_signRaw_types_unknownTransaction')}</ErrorAction>;*/
        default: {
            console.log(action);
            return <div>{action.simplePreview.description}</div>;
        }
    }
};
