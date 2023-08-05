import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { formatDecimals, getStockPrice } from '@tonkeeper/core/dist/utils/balance';
import React, { FC, useMemo } from 'react';
import { Address } from 'ton-core';
import { ListBlock } from '../../components/List';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { formatFiatCurrency, useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { useFormatFiat, useRate } from '../../state/rates';
import { useTonenpointStock } from '../../state/tonendpoint';
import {
    Amount,
    ReceiveDetailsHeader,
    SendDetailsHeader,
    TransferComment
} from './ActivityDetailsLayout';
import { ActionData } from './ActivityNotification';
import {
    ActionBeneficiaryDetails,
    ActionDate,
    ActionDetailsBlock,
    ActionExtraDetails,
    ActionRecipientDetails,
    ActionSenderDetails,
    ActionTransactionDetails,
    ErrorActivityNotification,
    Title,
    useBalanceValue
} from './NotificationCommon';

export const TonTransferActionNotification: FC<ActionData> = ({
    action,
    timestamp,
    event,
    isScam
}) => {
    const wallet = useWalletContext();
    const { tonTransfer } = action;

    const { data } = useRate(CryptoCurrency.TON);
    const { fiatAmount } = useFormatFiat(data, formatDecimals(tonTransfer?.amount ?? 0));

    if (!tonTransfer) {
        return <ErrorActivityNotification event={event} />;
    }

    if (tonTransfer.recipient.address === wallet.active.rawAddress) {
        return (
            <ActionDetailsBlock event={event}>
                <ReceiveDetailsHeader
                    isScam={isScam}
                    amount={tonTransfer.amount}
                    symbol={CryptoCurrency.TON}
                    total={fiatAmount}
                    timestamp={timestamp}
                />
                <ListBlock margin={false} fullWidth>
                    <ActionSenderDetails sender={tonTransfer.sender} />
                    <ActionTransactionDetails eventId={event.eventId} />
                    <ActionExtraDetails extra={event.extra} />
                    <TransferComment comment={isScam ? undefined : tonTransfer.comment} />
                </ListBlock>
            </ActionDetailsBlock>
        );
    }

    return (
        <ActionDetailsBlock event={event}>
            <SendDetailsHeader
                isScam={isScam}
                amount={tonTransfer.amount}
                symbol={CryptoCurrency.TON}
                total={fiatAmount}
                timestamp={timestamp}
            />
            <ListBlock margin={false} fullWidth>
                <ActionRecipientDetails recipient={tonTransfer.recipient} />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
                <TransferComment comment={isScam ? undefined : tonTransfer.comment} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const JettonTransferActionNotification: FC<ActionData> = ({ action, timestamp, event }) => {
    const wallet = useWalletContext();
    const { jettonTransfer } = action;

    const { fiat } = useAppContext();
    const { data: stock } = useTonenpointStock();

    const total = useMemo(() => {
        if (!stock || !jettonTransfer) return undefined;
        const price = getStockPrice(
            Address.parse(jettonTransfer.jetton.address).toString(),
            stock.today,
            fiat
        );
        if (price === null) return undefined;
        const amount = formatDecimals(
            price.multipliedBy(jettonTransfer.amount),
            jettonTransfer.jetton.decimals
        );
        return formatFiatCurrency(fiat, amount);
    }, [jettonTransfer?.jetton.address, stock, fiat]);

    if (!jettonTransfer) {
        return <ErrorActivityNotification event={event} />;
    }

    if (jettonTransfer.sender?.address === wallet.active.rawAddress) {
        return (
            <ActionDetailsBlock event={event}>
                <SendDetailsHeader
                    amount={jettonTransfer.amount}
                    decimals={jettonTransfer.jetton.decimals}
                    symbol={jettonTransfer.jetton.symbol}
                    total={total}
                    timestamp={timestamp}
                />
                <ListBlock margin={false} fullWidth>
                    {jettonTransfer.recipient && (
                        <ActionRecipientDetails recipient={jettonTransfer.recipient} />
                    )}
                    <ActionTransactionDetails eventId={event.eventId} />
                    <ActionExtraDetails extra={event.extra} />
                    <TransferComment comment={jettonTransfer.comment} />
                </ListBlock>
            </ActionDetailsBlock>
        );
    }

    return (
        <ActionDetailsBlock event={event}>
            <ReceiveDetailsHeader
                amount={jettonTransfer.amount}
                decimals={jettonTransfer.jetton.decimals}
                symbol={jettonTransfer.jetton.symbol}
                total={total}
                timestamp={timestamp}
            />
            <ListBlock margin={false} fullWidth>
                {jettonTransfer.sender && <ActionSenderDetails sender={jettonTransfer.sender} />}
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
                <TransferComment comment={jettonTransfer.comment} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const AuctionBidActionDetails: FC<ActionData> = ({ action, timestamp, event }) => {
    const { t } = useTranslation();
    const { auctionBid } = action;

    const { fiat } = useAppContext();
    const { data: stock } = useTonenpointStock();

    const format = useFormatCoinValue();
    const price = useBalanceValue(auctionBid?.amount.value, stock, fiat);

    if (!auctionBid) {
        return <ErrorActivityNotification event={event} />;
    }

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>{t('transaction_type_bid')}</Title>
                <Amount>
                    {format(auctionBid.amount.value)} {auctionBid.amount.tokenName}
                </Amount>
                {price && <Amount>≈&thinsp;{price}</Amount>}
                <ActionDate kind="send" timestamp={timestamp} />
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionBeneficiaryDetails beneficiary={auctionBid.bidder} />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};
