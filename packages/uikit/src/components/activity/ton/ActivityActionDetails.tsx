import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import {
    AccountEvent,
    ActionStatusEnum,
    JettonSwapAction,
    JettonTransferAction,
    TonTransferAction
} from '@tonkeeper/core/dist/tonApiV2';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import React, { FC } from 'react';
import { Address } from 'ton-core';
import { useWalletContext } from '../../../hooks/appContext';
import { useFormatCoinValue } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import { useFormatFiat, useRate } from '../../../state/rates';
import { ListBlock } from '../../List';
import {
    ActivityDetailsHeader,
    Amount,
    FailedDetail,
    TransferComment
} from '../ActivityDetailsLayout';
import {
    ActionBeneficiaryDetails,
    ActionDate,
    ActionDetailsBlock,
    ActionExtraDetails,
    ActionRecipientDetails,
    ActionSenderDetails,
    ActionTransactionDetails,
    ErrorActivityNotification,
    Title
} from '../NotificationCommon';
import { ActionData } from './ActivityNotification';

const TonTransferActionContent: FC<{
    tonTransfer: TonTransferAction;
    timestamp: number;
    event: AccountEvent;
    isScam: boolean;
    status?: ActionStatusEnum;
}> = ({ tonTransfer, timestamp, event, isScam, status }) => {
    const wallet = useWalletContext();
    const { data } = useRate(CryptoCurrency.TON);
    const { fiatAmount } = useFormatFiat(data, formatDecimals(tonTransfer.amount));

    const kind = tonTransfer.recipient.address === wallet.active.rawAddress ? 'received' : 'send';

    return (
        <ActionDetailsBlock event={event}>
            <ActivityDetailsHeader
                isScam={isScam}
                amount={tonTransfer.amount}
                symbol={CryptoCurrency.TON}
                total={fiatAmount}
                timestamp={timestamp}
                kind={kind}
                status={status}
            />
            <ListBlock margin={false} fullWidth>
                {kind === 'received' && <ActionSenderDetails sender={tonTransfer.sender} />}
                {kind === 'send' && <ActionRecipientDetails recipient={tonTransfer.recipient} />}
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
                <TransferComment comment={isScam ? undefined : tonTransfer.comment} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const TonTransferActionNotification: FC<ActionData> = ({
    action,
    timestamp,
    event,
    isScam
}) => {
    const { tonTransfer } = action;
    if (!tonTransfer) {
        return <ErrorActivityNotification event={event} />;
    }
    return (
        <TonTransferActionContent
            tonTransfer={tonTransfer}
            event={event}
            isScam={isScam}
            timestamp={timestamp}
            status={action.status}
        />
    );
};

const JettonTransferActionContent: FC<{
    jettonTransfer: JettonTransferAction;
    timestamp: number;
    event: AccountEvent;
    isScam: boolean;
    status?: ActionStatusEnum;
}> = ({ jettonTransfer, timestamp, event, isScam, status }) => {
    const wallet = useWalletContext();
    const { data } = useRate(Address.parse(jettonTransfer.jetton.address).toString());
    const { fiatAmount } = useFormatFiat(
        data,
        formatDecimals(jettonTransfer.amount, jettonTransfer.jetton.decimals)
    );

    const kind = jettonTransfer.sender?.address === wallet.active.rawAddress ? 'send' : 'received';

    return (
        <ActionDetailsBlock event={event}>
            <ActivityDetailsHeader
                isScam={isScam}
                amount={jettonTransfer.amount}
                decimals={jettonTransfer.jetton.decimals}
                symbol={jettonTransfer.jetton.symbol}
                total={fiatAmount}
                timestamp={timestamp}
                kind={kind}
                status={status}
            />
            <ListBlock margin={false} fullWidth>
                {kind === 'send' && jettonTransfer.recipient && (
                    <ActionRecipientDetails recipient={jettonTransfer.recipient} />
                )}
                {kind === 'received' && jettonTransfer.sender && (
                    <ActionSenderDetails sender={jettonTransfer.sender} />
                )}
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
                <TransferComment comment={jettonTransfer.comment} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const JettonTransferActionNotification: FC<ActionData> = ({
    action,
    timestamp,
    event,
    isScam
}) => {
    const { jettonTransfer } = action;

    if (!jettonTransfer) {
        return <ErrorActivityNotification event={event} />;
    } else {
        return (
            <JettonTransferActionContent
                jettonTransfer={jettonTransfer}
                timestamp={timestamp}
                event={event}
                isScam={isScam}
                status={action.status}
            />
        );
    }
};

export const AuctionBidActionDetails: FC<ActionData> = ({ action, timestamp, event }) => {
    const { t } = useTranslation();
    const { auctionBid } = action;

    const format = useFormatCoinValue();
    const { data } = useRate(CryptoCurrency.TON);
    const { fiatAmount } = useFormatFiat(data, formatDecimals(auctionBid?.amount.value ?? 0));

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
                {fiatAmount && <Amount>≈&thinsp;{fiatAmount}</Amount>}
                <ActionDate kind="send" timestamp={timestamp} />
                <FailedDetail status={action.status} />
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionBeneficiaryDetails beneficiary={auctionBid.bidder} />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const SmartContractExecActionDetails: FC<ActionData> = ({ action, timestamp, event }) => {
    const { t } = useTranslation();
    const { smartContractExec } = action;

    const format = useFormatCoinValue();
    const { data } = useRate(CryptoCurrency.TON);
    const { fiatAmount } = useFormatFiat(data, formatDecimals(smartContractExec?.tonAttached ?? 0));

    if (!smartContractExec) {
        return <ErrorActivityNotification event={event} />;
    }

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>{t('transaction_type_contract_call')}</Title>
                <Amount>
                    {format(smartContractExec.tonAttached)} {CryptoCurrency.TON}
                </Amount>
                {fiatAmount && <Amount>≈&thinsp;{fiatAmount}</Amount>}
                <ActionDate kind="send" timestamp={timestamp} />
                <FailedDetail status={action.status} />
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionRecipientDetails recipient={smartContractExec.contract} />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
                <TransferComment comment={smartContractExec.operation} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

const SwapTokensActionContent: FC<{
    jettonSwap: JettonSwapAction;
    timestamp: number;
    event: AccountEvent;
    status?: ActionStatusEnum;
}> = ({ jettonSwap, event, timestamp, status }) => {
    const { t } = useTranslation();
    const format = useFormatCoinValue();

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>{t('swap_title')}</Title>
                <Title secondary>
                    -&thinsp;{format(jettonSwap.amountIn, jettonSwap.jettonMasterIn.decimals)}{' '}
                    {jettonSwap.jettonMasterIn.symbol}
                </Title>
                <Title>
                    +&thinsp;{format(jettonSwap.amountOut, jettonSwap.jettonMasterOut.decimals)}{' '}
                    {jettonSwap.jettonMasterOut.symbol}
                </Title>
                <ActionDate kind="send" timestamp={timestamp} />
                <FailedDetail status={status} />
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const SwapTokensActionDetails: FC<ActionData> = ({ action, timestamp, event }) => {
    const { jettonSwap } = action;

    if (!jettonSwap) {
        return <ErrorActivityNotification event={event} />;
    }
    return (
        <SwapTokensActionContent
            jettonSwap={jettonSwap}
            event={event}
            timestamp={timestamp}
            status={action.status}
        />
    );
};
