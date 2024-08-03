import { Action, JettonSwapAction } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC } from 'react';

import {
    ActionRow,
    ErrorRow,
    HistoryCellAccount,
    HistoryCellActionGeneric,
    HistoryCellActionReceived,
    HistoryCellActionSent,
    HistoryCellAmount,
    HistoryCellComment
} from './HistoryCell';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import styled from 'styled-components';
import { ChevronRightIcon, FireIcon, SparkIcon, SwapIcon } from '../../../Icon';
import { useTranslation } from '../../../../hooks/translation';
import { toDexName } from '../../../activity/NotificationCommon';
import { useActiveWallet } from '../../../../state/wallet';

type SwapAsset = {
    amount: string | number;
    symbol: string;
    decimals: number;
};

export const swapValue = (
    jettonSwap: JettonSwapAction
): { assetIn: SwapAsset; assetOut: SwapAsset } => {
    let assetIn: SwapAsset;
    let assetOut: SwapAsset;

    if (jettonSwap.tonIn) {
        assetIn = {
            amount: jettonSwap.tonIn,
            symbol: CryptoCurrency.TON,
            decimals: 9
        };
    } else {
        assetIn = {
            amount: jettonSwap.amountIn,
            symbol: jettonSwap.jettonMasterIn!.symbol,
            decimals: jettonSwap.jettonMasterIn!.decimals
        };
    }

    if (jettonSwap.tonOut) {
        assetOut = {
            amount: jettonSwap.tonOut,
            symbol: CryptoCurrency.TON,
            decimals: 9
        };
    } else {
        assetOut = {
            amount: jettonSwap.amountOut,
            symbol: jettonSwap.jettonMasterOut!.symbol,
            decimals: jettonSwap.jettonMasterOut!.decimals
        };
    }

    return { assetIn: assetIn!, assetOut: assetOut! };
};

export const JettonTransferDesktopAction: FC<{
    action: Action;
    isScam: boolean;
}> = ({ action, isScam }) => {
    const wallet = useActiveWallet();
    const { jettonTransfer } = action;

    if (!jettonTransfer) {
        return <ErrorRow />;
    }

    if (eqAddresses(wallet.rawAddress, jettonTransfer.sender?.address)) {
        return (
            <>
                <HistoryCellActionSent isFailed={action.status === 'failed'} />
                <HistoryCellAccount
                    account={jettonTransfer.recipient}
                    fallbackAddress={jettonTransfer.recipientsWallet}
                />
                <ActionRow>
                    <HistoryCellComment comment={jettonTransfer.comment} />
                    <HistoryCellAmount
                        amount={jettonTransfer.amount}
                        symbol={jettonTransfer.jetton.symbol}
                        decimals={jettonTransfer.jetton.decimals}
                        isFailed={action.status === 'failed'}
                        isNegative
                    />
                </ActionRow>
            </>
        );
    }
    return (
        <>
            <HistoryCellActionReceived isScam={isScam} isFailed={action.status === 'failed'} />
            <HistoryCellAccount
                account={jettonTransfer.sender}
                fallbackAddress={jettonTransfer.sendersWallet}
            />
            <ActionRow>
                <HistoryCellComment comment={jettonTransfer.comment} isScam={isScam} />
                <HistoryCellAmount
                    amount={jettonTransfer.amount}
                    symbol={jettonTransfer.jetton.symbol}
                    decimals={jettonTransfer.jetton.decimals}
                    isFailed={action.status === 'failed'}
                    isSpam={isScam}
                />
            </ActionRow>
        </>
    );
};

const SwapHistoryCell = styled.div`
    display: flex;
    align-items: center;

    svg {
        color: ${p => p.theme.textSecondary};
    }
`;

export const JettonSwapDesktopAction: FC<{ action: Action }> = ({ action }) => {
    const { t } = useTranslation();
    const { jettonSwap } = action;

    if (!jettonSwap) {
        return <ErrorRow />;
    }

    const { assetIn, assetOut } = swapValue(jettonSwap);
    const isFailed = action.status === 'failed';

    return (
        <>
            <HistoryCellActionGeneric icon={<SwapIcon color="iconPrimary" />} isFailed={isFailed}>
                {t('transactions_swap')}
            </HistoryCellActionGeneric>
            <HistoryCellAccount account={{ name: toDexName(jettonSwap.dex) }} />
            <ActionRow>
                <HistoryCellComment />
                <SwapHistoryCell>
                    <HistoryCellAmount
                        amount={assetIn.amount}
                        symbol={assetIn.symbol}
                        decimals={assetIn.decimals}
                        isFailed={isFailed}
                        isNegative
                    />
                    <ChevronRightIcon />
                    <HistoryCellAmount
                        amount={assetOut.amount}
                        symbol={assetOut.symbol}
                        decimals={assetOut.decimals}
                        isFailed={isFailed}
                    />
                </SwapHistoryCell>
            </ActionRow>
        </>
    );
};

export const JettonBurnDesktopAction: FC<{ action: Action }> = ({ action }) => {
    const { t } = useTranslation();
    const { jettonBurn } = action;

    if (!jettonBurn) {
        return <ErrorRow />;
    }

    const isFailed = action.status === 'failed';

    return (
        <>
            <HistoryCellActionGeneric icon={<FireIcon color="iconPrimary" />} isFailed={isFailed}>
                {t('transactions_burned')}
            </HistoryCellActionGeneric>
            <HistoryCellAccount account={{ address: jettonBurn.jetton.address }} />
            <ActionRow>
                <HistoryCellComment />
                <HistoryCellAmount
                    amount={jettonBurn.amount}
                    symbol={jettonBurn.jetton.symbol}
                    decimals={jettonBurn.jetton.decimals}
                    isFailed={isFailed}
                    isNegative
                />
            </ActionRow>
        </>
    );
};

export const JettonMintDesktopAction: FC<{ action: Action }> = ({ action }) => {
    const { t } = useTranslation();
    const { jettonMint } = action;

    if (!jettonMint) {
        return <ErrorRow />;
    }
    const isFailed = action.status === 'failed';

    return (
        <>
            <HistoryCellActionGeneric icon={<SparkIcon color="iconPrimary" />} isFailed={isFailed}>
                {t('transaction_type_mint')}
            </HistoryCellActionGeneric>
            <HistoryCellAccount account={{ address: jettonMint.jetton.address }} />
            <ActionRow>
                <HistoryCellComment />
                <HistoryCellAmount
                    amount={jettonMint.amount}
                    symbol={jettonMint.jetton.symbol}
                    decimals={jettonMint.jetton.decimals}
                    isFailed={isFailed}
                />
            </ActionRow>
        </>
    );
};
