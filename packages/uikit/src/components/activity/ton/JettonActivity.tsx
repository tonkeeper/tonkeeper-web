import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import { useFormatCoinValue } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import { FailedNote, ReceiveActivityAction, SendActivityAction } from '../ActivityActionLayout';
import { ActivityIcon, ReceiveIcon, SentIcon, SwapIcon } from '../ActivityIcons';
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
import { toDexName } from '../NotificationCommon';
import { useSwapValue } from './JettonNotifications';
import { useActiveTonNetwork, useActiveWallet } from '../../../state/wallet';

export interface JettonActionProps {
    action: Action;
    date: string;
}

export const JettonTransferAction: FC<{ action: Action; date: string }> = ({ action, date }) => {
    const wallet = useActiveWallet();
    const network = useActiveTonNetwork();
    const { jettonTransfer } = action;

    const format = useFormatCoinValue();

    if (!jettonTransfer) {
        return <ErrorAction />;
    }

    const isScam = jettonTransfer.jetton.verification === 'blacklist';

    if (jettonTransfer.sender?.address === wallet.rawAddress) {
        return (
            <SendActivityAction
                amount={format(jettonTransfer.amount, jettonTransfer.jetton.decimals)}
                symbol={jettonTransfer.jetton.symbol}
                recipient={
                    jettonTransfer.recipient?.name ??
                    toShortValue(
                        formatAddress(
                            jettonTransfer.recipient?.address ?? jettonTransfer.recipientsWallet,
                            network
                        )
                    )
                }
                isScam={isScam}
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
                        network
                    )
                )
            }
            isScam={jettonTransfer.sender?.isScam || isScam}
            date={date}
            comment={jettonTransfer.comment}
            status={action.status}
        />
    );
};

export const JettonSwapAction: FC<JettonActionProps> = ({ action, date }) => {
    const { t } = useTranslation();
    const { jettonSwap } = action;

    const [valueIn, valueOut] = useSwapValue(jettonSwap);

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
                    <AmountText green></AmountText>
                    <AmountText green>
                        +&thinsp;
                        {valueOut}
                    </AmountText>
                </FirstLine>
                <FirstLine>
                    <SecondaryText>{toDexName(jettonSwap.dex)}</SecondaryText>
                    <AmountText></AmountText>
                    <AmountText>-&thinsp;{valueIn}</AmountText>
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

export const JettonBurnAction: FC<JettonActionProps> = ({ action, date }) => {
    const { t } = useTranslation();
    const { jettonBurn } = action;
    const format = useFormatCoinValue();
    const network = useActiveTonNetwork();

    if (!jettonBurn) {
        return <ErrorAction />;
    }
    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>
                <SentIcon />
            </ActivityIcon>
            <ColumnLayout
                title={t('transactions_burned')}
                amount={<>-&thinsp;{format(jettonBurn.amount, jettonBurn.jetton.decimals)}</>}
                entry={jettonBurn.jetton.symbol}
                address={toShortValue(formatAddress(jettonBurn.jetton.address, network, true))}
                date={date}
            />
            <FailedNote status={action.status} />
        </ListItemGrid>
    );
};

export const JettonMintAction: FC<JettonActionProps> = ({ action, date }) => {
    const { t } = useTranslation();
    const { jettonMint } = action;
    const format = useFormatCoinValue();
    const network = useActiveTonNetwork();

    if (!jettonMint) {
        return <ErrorAction />;
    }
    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>
                <ReceiveIcon />
            </ActivityIcon>
            <ColumnLayout
                title={t('transaction_type_mint')}
                amount={<>+&thinsp;{format(jettonMint.amount, jettonMint.jetton.decimals)}</>}
                entry={jettonMint.jetton.symbol}
                address={toShortValue(formatAddress(jettonMint.jetton.address, network, true))}
                date={date}
                green
            />
            <FailedNote status={action.status} />
        </ListItemGrid>
    );
};
