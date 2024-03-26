export {};
/*
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import {
    AccountEvent,
    ActionStatusEnum,
    JettonBurnAction,
    JettonMintAction,
    JettonSwapAction,
    JettonTransferAction
} from '@tonkeeper/core/dist/tonApiV2';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import React, { FC, useMemo } from 'react';
import { Address } from 'ton-core';
import { useWalletContext } from '../../../hooks/appContext';
import { useFormatCoinValue } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import { useFormatFiat, useRate } from '../../../state/rates';
import { ListBlock } from '../../List';
import { ActivityDetailsHeader, FailedDetail, TransferComment } from '../ActivityDetailsLayout';
import {
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
    const blacklist = jettonTransfer.jetton.verification === 'blacklist';
    const kind = jettonTransfer.sender?.address === wallet.active.rawAddress ? 'send' : 'received';

    return (
        <ActionDetailsBlock event={event}>
            <ActivityDetailsHeader
                isScam={isScam || blacklist}
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

export const useSwapValue = (jettonSwap: JettonSwapAction | undefined) => {
    const format = useFormatCoinValue();
    return useMemo(() => {
        if (!jettonSwap) return ['', ''];

        const result: string[] = [];

        if (jettonSwap.tonIn) {
            result.push(`${format(jettonSwap.tonIn)} ${CryptoCurrency.TON}`);
        } else {
            result.push(
                `${format(jettonSwap.amountIn, jettonSwap.jettonMasterIn?.decimals)} ${
                    jettonSwap.jettonMasterIn?.symbol
                }`
            );
        }

        if (jettonSwap.tonOut) {
            result.push(`${format(jettonSwap.tonOut)} ${CryptoCurrency.TON}`);
        } else {
            result.push(
                `${format(jettonSwap.amountOut, jettonSwap.jettonMasterOut?.decimals)} ${
                    jettonSwap.jettonMasterOut?.symbol
                }`
            );
        }
        return result;
    }, [format, jettonSwap]);
};
const SwapTokensActionContent: FC<{
    jettonSwap: JettonSwapAction;
    timestamp: number;
    event: AccountEvent;
    status?: ActionStatusEnum;
}> = ({ jettonSwap, event, timestamp, status }) => {
    const { t } = useTranslation();

    const [valueIn, valueOut] = useSwapValue(jettonSwap);

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>{t('swap_title')}</Title>
                <Title secondary>-&thinsp;{valueIn}</Title>
                <Title>+&thinsp;{valueOut}</Title>
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

const JettonMintActionContent: FC<{
    jettonMint: JettonMintAction;
    timestamp: number;
    event: AccountEvent;
    isScam: boolean;
    status?: ActionStatusEnum;
}> = ({ jettonMint, timestamp, event, isScam, status }) => {
    const { data } = useRate(Address.parse(jettonMint.jetton.address).toString());
    const { fiatAmount } = useFormatFiat(
        data,
        formatDecimals(jettonMint.amount, jettonMint.jetton.decimals)
    );

    return (
        <ActionDetailsBlock event={event}>
            <ActivityDetailsHeader
                isScam={isScam}
                amount={jettonMint.amount}
                decimals={jettonMint.jetton.decimals}
                symbol={jettonMint.jetton.symbol}
                total={fiatAmount}
                timestamp={timestamp}
                kind="received"
                status={status}
            />
            <ListBlock margin={false} fullWidth>
                <ActionRecipientDetails recipient={jettonMint.recipient} />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const JettonMintActionNotification: FC<ActionData> = ({
    action,
    timestamp,
    event,
    isScam
}) => {
    const { jettonMint } = action;

    if (!jettonMint) {
        return <ErrorActivityNotification event={event} />;
    } else {
        return (
            <JettonMintActionContent
                jettonMint={jettonMint}
                timestamp={timestamp}
                event={event}
                isScam={isScam}
                status={action.status}
            />
        );
    }
};

const JettonBurnActionContent: FC<{
    jettonBurn: JettonBurnAction;
    timestamp: number;
    event: AccountEvent;
    isScam: boolean;
    status?: ActionStatusEnum;
}> = ({ jettonBurn, timestamp, event, isScam, status }) => {
    const { data } = useRate(Address.parse(jettonBurn.jetton.address).toString());
    const { fiatAmount } = useFormatFiat(
        data,
        formatDecimals(jettonBurn.amount, jettonBurn.jetton.decimals)
    );

    return (
        <ActionDetailsBlock event={event}>
            <ActivityDetailsHeader
                isScam={isScam}
                amount={jettonBurn.amount}
                decimals={jettonBurn.jetton.decimals}
                symbol={jettonBurn.jetton.symbol}
                total={fiatAmount}
                timestamp={timestamp}
                kind="send"
                status={status}
            />
            <ListBlock margin={false} fullWidth>
                <ActionSenderDetails sender={jettonBurn.sender} bounced />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const JettonBurnActionNotification: FC<ActionData> = ({
    action,
    timestamp,
    event,
    isScam
}) => {
    const { jettonBurn } = action;

    if (!jettonBurn) {
        return <ErrorActivityNotification event={event} />;
    } else {
        return (
            <JettonBurnActionContent
                jettonBurn={jettonBurn}
                timestamp={timestamp}
                event={event}
                isScam={isScam}
                status={action.status}
            />
        );
    }
};
*/
