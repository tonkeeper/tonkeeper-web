import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import { ListItemPayload } from '../../../components/List';
import {
    ActivityIcon,
    ContractDeployIcon,
    SentIcon,
    SwapIcon
} from '../../../components/activity/ActivityIcons';
import { useWalletContext } from '../../../hooks/appContext';
import { useFormatCoinValue } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import { FailedNote, ReceiveActivityAction, SendActivityAction } from '../ActivityActionLayout';
import {
    AmountText,
    Description,
    ErrorAction,
    FirstLabel,
    FirstLine,
    ListItemGrid,
    SecondLine,
    SecondaryText
} from '../CommonAction';
import { toDexName } from '../NotificationCommon';
import { SubscribeAction, UnSubscribeAction } from '../SubscribeAction';
import { ContractDeployAction } from './ContractDeployAction';
import { NftComment, NftItemTransferAction, NftPurchaseAction } from './NftActivity';

const TonTransferAction: FC<{
    action: Action;
    date: string;
    isScam: boolean;
}> = ({ action, date, isScam }) => {
    const wallet = useWalletContext();
    const { tonTransfer } = action;

    const format = useFormatCoinValue();

    if (!tonTransfer) {
        return <ErrorAction />;
    }

    if (tonTransfer.recipient.address === wallet.active.rawAddress) {
        return (
            <ReceiveActivityAction
                amount={format(tonTransfer.amount)}
                sender={
                    tonTransfer.sender.name ??
                    toShortValue(formatAddress(tonTransfer.sender.address, wallet.network))
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
                toShortValue(formatAddress(tonTransfer.recipient.address, wallet.network))
            }
            date={date}
            isScam={isScam}
            comment={tonTransfer.comment}
            status={action.status}
        />
    );
};

const JettonTransferAction: FC<{ action: Action; date: string }> = ({ action, date }) => {
    const wallet = useWalletContext();
    const { jettonTransfer } = action;

    const format = useFormatCoinValue();

    if (!jettonTransfer) {
        return <ErrorAction />;
    }

    if (jettonTransfer.sender?.address === wallet.active.rawAddress) {
        return (
            <SendActivityAction
                amount={format(jettonTransfer.amount, jettonTransfer.jetton.decimals)}
                symbol={jettonTransfer.jetton.symbol}
                recipient={
                    jettonTransfer.recipient?.name ??
                    toShortValue(
                        formatAddress(
                            jettonTransfer.recipient?.address ?? jettonTransfer.recipientsWallet,
                            wallet.network
                        )
                    )
                }
                date={date}
                comment={jettonTransfer.comment}
                status={action.status}
            />
        );
    }

    return (
        <ReceiveActivityAction
            amount={format(jettonTransfer.amount, jettonTransfer.jetton.decimals)}
            symbol={jettonTransfer.jetton.symbol}
            sender={
                jettonTransfer.sender?.name ??
                toShortValue(
                    formatAddress(
                        jettonTransfer.sender?.address ?? jettonTransfer.sendersWallet,
                        wallet.network
                    )
                )
            }
            isScam={jettonTransfer.sender?.isScam}
            date={date}
            comment={jettonTransfer.comment}
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
    const wallet = useWalletContext();
    const format = useFormatCoinValue();

    if (!smartContractExec) {
        return <ErrorAction />;
    }

    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>
                <ContractDeployIcon />
            </ActivityIcon>
            <Description>
                <FirstLine>
                    <FirstLabel>{t('transaction_type_contract_call')}</FirstLabel>
                    <AmountText>-&thinsp;{format(smartContractExec.tonAttached)}</AmountText>
                    <AmountText>{CryptoCurrency.TON}</AmountText>
                </FirstLine>
                <SecondLine>
                    <SecondaryText>
                        {toShortValue(
                            formatAddress(smartContractExec.contract.address, wallet.network)
                        )}
                    </SecondaryText>
                    <SecondaryText>{date}</SecondaryText>
                </SecondLine>
            </Description>
            <FailedNote status={action.status} />
        </ListItemGrid>
    );
};

export const JettonSwapAction: FC<{
    action: Action;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();
    const { jettonSwap } = action;
    const format = useFormatCoinValue();

    if (!jettonSwap) {
        return <ErrorAction />;
    }

    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>
                <SwapIcon />
            </ActivityIcon>
            <Description>
                <FirstLine>
                    <FirstLabel>{t('swap_title')}</FirstLabel>
                    <AmountText green>
                        +&thinsp;{format(jettonSwap.amountOut, jettonSwap.jettonMasterOut.decimals)}
                    </AmountText>
                    <AmountText green>{jettonSwap.jettonMasterOut.symbol}</AmountText>
                </FirstLine>
                <FirstLine>
                    <SecondaryText>{toDexName(jettonSwap.dex)}</SecondaryText>
                    <AmountText>
                        -&thinsp;{format(jettonSwap.amountIn, jettonSwap.jettonMasterIn.decimals)}
                    </AmountText>
                    <AmountText>{jettonSwap.jettonMasterIn.symbol}</AmountText>
                </FirstLine>
                <SecondLine>
                    <SecondaryText></SecondaryText>
                    <SecondaryText>{date}</SecondaryText>
                </SecondLine>
            </Description>
            <FailedNote status={action.status} />
        </ListItemGrid>
    );
};

const AuctionBidAction: FC<{
    action: Action;
    date: string;
    openNft: (nft: NftItemRepr) => void;
}> = ({ action, date, openNft }) => {
    const { t } = useTranslation();
    const { auctionBid } = action;
    const wallet = useWalletContext();
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
                        {auctionBid.auctionType ??
                            toShortValue(formatAddress(auctionBid.bidder.address, wallet.network))}
                    </SecondaryText>
                    <SecondaryText>{date}</SecondaryText>
                </SecondLine>
            </Description>
            {auctionBid.nft && <NftComment address={auctionBid.nft.address} openNft={openNft} />}
            <FailedNote status={action.status} />
        </ListItemGrid>
    );
};

export const ActivityAction: FC<{
    action: Action;
    date: string;
    isScam: boolean;
    openNft: (nft: NftItemRepr) => void;
}> = ({ action, isScam, date, openNft }) => {
    const { t } = useTranslation();

    switch (action.type) {
        case 'TonTransfer':
            return <TonTransferAction action={action} date={date} isScam={isScam} />;
        case 'JettonTransfer':
            return <JettonTransferAction action={action} date={date} />;
        case 'NftItemTransfer':
            return <NftItemTransferAction action={action} date={date} openNft={openNft} />;
        case 'NftPurchase':
            return <NftPurchaseAction action={action} date={date} openNft={openNft} />;
        case 'ContractDeploy':
            return <ContractDeployAction action={action} date={date} openNft={openNft} />;
        case 'UnSubscribe':
            return <UnSubscribeAction action={action} date={date} />;
        case 'Subscribe':
            return <SubscribeAction action={action} date={date} />;
        case 'AuctionBid':
            return <AuctionBidAction action={action} date={date} openNft={openNft} />;
        case 'SmartContractExec':
            return <SmartContractExecAction action={action} date={date} />;
        case 'JettonSwap':
            return <JettonSwapAction action={action} date={date} />;
        case 'Unknown':
            return <ErrorAction>{t('txActions_signRaw_types_unknownTransaction')}</ErrorAction>;
        default: {
            console.log(action);
            return <ListItemPayload>{action.type}</ListItemPayload>;
        }
    }
};
