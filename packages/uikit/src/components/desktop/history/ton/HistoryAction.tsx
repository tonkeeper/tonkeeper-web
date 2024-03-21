import { FC } from 'react';
import { Action } from '@tonkeeper/core/dist/tonApiV2';

import { TonTransferDesktopAction } from './TonTransferDesktopAction';
import { useTranslation } from '../../../../hooks/translation';
import { NftPurchaseDesktopAction, NftTransferDesktopAction } from './NftDesktopAction';

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
        /* case 'ContractDeploy':
            return <ContractDeployAction action={action} date={date} />;
        case 'UnSubscribe':
            return <UnSubscribeAction action={action} date={date} />;
        case 'Subscribe':
            return <SubscribeAction action={action} date={date} />;
        case 'AuctionBid':
            return <AuctionBidAction action={action} date={date} />;
        case 'SmartContractExec':
            return <SmartContractExecAction action={action} date={date} />;
        case 'JettonTransfer':
            return <JettonTransferAction action={action} date={date} />;
        case 'JettonSwap':
            return <JettonSwapAction action={action} date={date} />;
        case 'JettonBurn':
            return <JettonBurnAction action={action} date={date} />;
        case 'JettonMint':
            return <JettonMintAction action={action} date={date} />;
        case 'DepositStake':
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
