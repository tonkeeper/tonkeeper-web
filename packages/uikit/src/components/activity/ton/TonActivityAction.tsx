import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { formatAddress, seeIfAddressEqual, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { FC } from 'react';
import { ListItemPayload } from '../../../components/List';
import {
    ActivityIcon,
    ContractDeployIcon,
    SentIcon
} from '../../../components/activity/ActivityIcons';
import { useFormatCoinValue } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import { FailedNote, ReceiveActivityAction, SendActivityAction } from '../ActivityActionLayout';
import {
    AmountText,
    ColumnLayout,
    Description,
    ErrorAction,
    FirstLabel,
    FirstLine,
    ListItemGrid,
    SecondLine,
    SecondaryText
} from '../CommonAction';
import { ContractDeployAction } from './ContractDeployAction';
import {
    JettonBurnAction,
    JettonMintAction,
    JettonSwapAction,
    JettonTransferAction
} from './JettonActivity';
import { NftItemTransferAction, NftPurchaseAction } from './NftActivity';
import {
    DepositStakeAction,
    WithdrawRequestStakeAction,
    WithdrawStakeAction
} from './StakeActivity';
import { SubscribeAction, UnSubscribeAction } from './SubscribeAction';
import { useActiveTonNetwork, useActiveWallet } from '../../../state/wallet';

const TonTransferAction: FC<{
    action: Action;
    date: string;
    isScam: boolean;
}> = ({ action, date, isScam }) => {
    const wallet = useActiveWallet();
    const { tonTransfer } = action;
    const network = useActiveTonNetwork();

    const format = useFormatCoinValue();

    if (!tonTransfer) {
        return <ErrorAction />;
    }

    if (tonTransfer.recipient.address === wallet.rawAddress) {
        return (
            <ReceiveActivityAction
                amount={format(tonTransfer.amount)}
                sender={
                    tonTransfer.sender.name ??
                    toShortValue(formatAddress(tonTransfer.sender.address, network))
                }
                symbol={CryptoCurrency.TON}
                date={date}
                isScam={tonTransfer.sender.isScam || isScam}
                comment={tonTransfer.comment}
                status={action.status}
            />
        );
    }
    return (
        <SendActivityAction
            amount={format(tonTransfer.amount)}
            symbol={CryptoCurrency.TON}
            recipient={
                tonTransfer.recipient.name ??
                toShortValue(formatAddress(tonTransfer.recipient.address, network))
            }
            date={date}
            isScam={isScam}
            comment={tonTransfer.comment}
            status={action.status}
        />
    );
};

export const SmartContractExecAction: FC<{
    action: Action;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();
    const { smartContractExec } = action;
    const wallet = useActiveWallet();
    const format = useFormatCoinValue();
    const network = useActiveTonNetwork();

    if (!smartContractExec) {
        return <ErrorAction />;
    }

    if (seeIfAddressEqual(smartContractExec.contract.address, wallet.rawAddress)) {
        return (
            <ListItemGrid>
                <ActivityIcon status={action.status}>
                    <ContractDeployIcon />
                </ActivityIcon>
                <ColumnLayout
                    title={t('transactions_smartcontract_exec')}
                    amount={<>+&thinsp;{format(smartContractExec.tonAttached)}</>}
                    green
                    entry={CryptoCurrency.TON}
                    address={toShortValue(
                        formatAddress(smartContractExec.contract.address, network)
                    )}
                    date={date}
                />
                <FailedNote status={action.status} />
            </ListItemGrid>
        );
    } else {
        return (
            <ListItemGrid>
                <ActivityIcon status={action.status}>
                    <ContractDeployIcon />
                </ActivityIcon>
                <ColumnLayout
                    title={t('transactions_smartcontract_exec')}
                    amount={<>-&thinsp;{format(smartContractExec.tonAttached)}</>}
                    entry={CryptoCurrency.TON}
                    address={toShortValue(
                        formatAddress(smartContractExec.contract.address, network, true)
                    )}
                    date={date}
                />
                <FailedNote status={action.status} />
            </ListItemGrid>
        );
    }
};

const AuctionBidAction: FC<{
    action: Action;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();
    const { auctionBid } = action;
    const network = useActiveTonNetwork();
    const format = useFormatCoinValue();

    if (!auctionBid) {
        return <ErrorAction />;
    }

    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>
                <SentIcon />
            </ActivityIcon>
            <Description>
                <FirstLine>
                    <FirstLabel>{t('transaction_type_bid')}</FirstLabel>
                    <AmountText>-&thinsp;{format(auctionBid.amount.value)}</AmountText>
                    <AmountText>{auctionBid.amount.tokenName}</AmountText>
                </FirstLine>
                <SecondLine>
                    <SecondaryText>
                        {(auctionBid.auctionType as string) !== ''
                            ? auctionBid.auctionType
                            : toShortValue(
                                  formatAddress(auctionBid.auction.address, network, true)
                              )}
                    </SecondaryText>
                    <SecondaryText>{date}</SecondaryText>
                </SecondLine>
            </Description>
            <FailedNote status={action.status} />
        </ListItemGrid>
    );
};

const DomainRenewAction: FC<{
    action: Action;
    date: string;
}> = ({ action, date }) => {
    const { domainRenew, simplePreview } = action;

    if (!domainRenew) {
        return <ErrorAction />;
    }

    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>
                <SentIcon />
            </ActivityIcon>
            <Description>
                <FirstLine>
                    <FirstLabel>{simplePreview.name}</FirstLabel>
                </FirstLine>
                <SecondLine>
                    <SecondaryText>{domainRenew.domain}</SecondaryText>
                    <SecondaryText>{date}</SecondaryText>
                </SecondLine>
            </Description>
            <FailedNote status={action.status} />
        </ListItemGrid>
    );
};

export const ActivityAction: FC<{
    action: Action;
    date: string;
    isScam: boolean;
}> = ({ action, isScam, date }) => {
    const { t } = useTranslation();

    switch (action.type) {
        case 'TonTransfer':
            return <TonTransferAction action={action} date={date} isScam={isScam} />;
        case 'NftItemTransfer':
            return <NftItemTransferAction action={action} date={date} />;
        case 'NftPurchase':
            return <NftPurchaseAction action={action} date={date} />;
        case 'ContractDeploy':
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
            return <ErrorAction>{t('txActions_signRaw_types_unknownTransaction')}</ErrorAction>;
        default: {
            console.log(action);
            return <ListItemPayload>{action.simplePreview.description}</ListItemPayload>;
        }
    }
};
