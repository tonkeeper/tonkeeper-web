import { FC } from 'react';
import { Action } from '@tonkeeper/core/dist/tonApiV2';

import {
    ExtraCurrencyTransferDesktopAction,
    TonTransferDesktopAction
} from './TonTransferDesktopAction';
import { NftPurchaseDesktopAction, NftTransferDesktopAction } from './NftDesktopActions';
import {
    JettonBurnDesktopAction,
    JettonMintDesktopAction,
    JettonSwapDesktopAction,
    JettonTransferDesktopAction
} from './JettonDesktopActions';
import { ContractDeployDesktopAction } from './ContractDeployAction';
import { SmartContractExecDesktopAction } from './SmartContractExecDesktopAction';
import { AuctionBidDesktopAction } from './AuctionDesktopActions';
import {
    DepositStakeDesktopAction,
    WithdrawRequestStakeDesktopAction,
    WithdrawStakeDesktopAction
} from './StakeActions';
import { DomainRenewDesktopAction } from './DnsActions';
import { UnknownDesktopAction } from './UnknownAction';
import { SimplePreviewDesktopAction } from './SimplePreviewDesktopAction';
import { assertUnreachableSoft } from '@tonkeeper/core/dist/utils/types';
import { PurchaseDesktopAction } from './PurchaseDesktopAction';
import { ExtensionDesktopActions } from './ExtensionDesktopActions';

export const HistoryAction: FC<{
    action: Action;
    date: string;
    isScam: boolean;
    // eslint-disable-next-line complexity
}> = ({ action, isScam }) => {
    switch (action.type) {
        case 'TonTransfer':
            return <TonTransferDesktopAction action={action} isScam={isScam} />;
        case 'NftItemTransfer':
            return <NftTransferDesktopAction action={action} isScam={isScam} />;
        case 'NftPurchase':
            return <NftPurchaseDesktopAction action={action} />;
        case 'ContractDeploy':
            return <ContractDeployDesktopAction action={action} />;
        case 'AuctionBid':
            return <AuctionBidDesktopAction action={action} />;
        case 'SmartContractExec':
            return <SmartContractExecDesktopAction action={action} isScam={isScam} />;
        case 'JettonTransfer':
            return <JettonTransferDesktopAction action={action} isScam={isScam} />;
        case 'JettonSwap':
            return <JettonSwapDesktopAction action={action} />;
        case 'JettonBurn':
            return <JettonBurnDesktopAction action={action} />;
        case 'JettonMint':
            return <JettonMintDesktopAction action={action} />;
        case 'DepositStake':
            return <DepositStakeDesktopAction action={action} />;
        case 'WithdrawStake':
            return <WithdrawStakeDesktopAction action={action} />;
        case 'WithdrawStakeRequest':
            return <WithdrawRequestStakeDesktopAction action={action} />;
        case 'DomainRenew':
            return <DomainRenewDesktopAction action={action} />;
        case 'ExtraCurrencyTransfer':
            return <ExtraCurrencyTransferDesktopAction action={action} isScam={isScam} />;
        case 'Purchase':
            return <PurchaseDesktopAction action={action} />;
        case 'Unknown':
            return <UnknownDesktopAction action={action} />;
        case 'Subscribe':
        case 'UnSubscribe':
            return <ExtensionDesktopActions action={action} isScam={isScam} />;
        case 'ElectionsDepositStake':
        case 'ElectionsRecoverStake':
            return <SimplePreviewDesktopAction action={action} isScam={isScam} />;
        default: {
            assertUnreachableSoft(action.type);
            return <SimplePreviewDesktopAction action={action} isScam={isScam} />;
        }
    }
};
