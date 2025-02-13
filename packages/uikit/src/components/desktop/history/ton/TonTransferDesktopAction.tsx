import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { FC } from 'react';

import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import {
    ActionRow,
    HistoryCellActionReceived,
    HistoryCellActionSent,
    HistoryCellAmount,
    HistoryCellComment,
    HistoryCellAccount,
    ErrorRow
} from './HistoryCell';
import { useActiveWallet } from '../../../../state/wallet';

export const TonTransferDesktopAction: FC<{
    action: Action;
    isScam: boolean;
}> = ({ action, isScam }) => {
    const wallet = useActiveWallet();
    const { tonTransfer } = action;

    if (!tonTransfer) {
        return <ErrorRow />;
    }

    if (eqAddresses(tonTransfer.recipient.address, wallet.rawAddress)) {
        return (
            <>
                <HistoryCellActionReceived isScam={isScam} isFailed={action.status === 'failed'} />
                <HistoryCellAccount account={tonTransfer.sender} />
                <ActionRow>
                    <HistoryCellComment comment={tonTransfer.comment} isScam={isScam} />
                    <HistoryCellAmount
                        amount={tonTransfer.amount}
                        symbol={CryptoCurrency.TON}
                        decimals={9}
                        isFailed={action.status === 'failed'}
                        isSpam={isScam}
                    />
                </ActionRow>
            </>
        );
    }
    return (
        <>
            <HistoryCellActionSent isFailed={action.status === 'failed'} />
            <HistoryCellAccount account={tonTransfer.recipient} />
            <ActionRow>
                <HistoryCellComment comment={tonTransfer.comment} />
                <HistoryCellAmount
                    amount={tonTransfer.amount}
                    symbol={CryptoCurrency.TON}
                    decimals={9}
                    isFailed={action.status === 'failed'}
                    isNegative
                />
            </ActionRow>
        </>
    );
};

export const ExtraCurrencyTransferDesktopAction: FC<{
    action: Action;
    isScam: boolean;
}> = ({ action, isScam }) => {
    const wallet = useActiveWallet();
    const { extraCurrencyTransfer } = action;

    if (!extraCurrencyTransfer) {
        return <ErrorRow />;
    }

    if (eqAddresses(extraCurrencyTransfer.recipient.address, wallet.rawAddress)) {
        return (
            <>
                <HistoryCellActionReceived isScam={isScam} isFailed={action.status === 'failed'} />
                <HistoryCellAccount account={extraCurrencyTransfer.sender} />
                <ActionRow>
                    <HistoryCellComment comment={extraCurrencyTransfer.comment} isScam={isScam} />
                    <HistoryCellAmount
                        amount={extraCurrencyTransfer.amount}
                        symbol={extraCurrencyTransfer.currency.symbol}
                        decimals={extraCurrencyTransfer.currency.decimals}
                        isFailed={action.status === 'failed'}
                        isSpam={isScam}
                    />
                </ActionRow>
            </>
        );
    }
    return (
        <>
            <HistoryCellActionSent isFailed={action.status === 'failed'} />
            <HistoryCellAccount account={extraCurrencyTransfer.recipient} />
            <ActionRow>
                <HistoryCellComment comment={extraCurrencyTransfer.comment} />
                <HistoryCellAmount
                    amount={extraCurrencyTransfer.amount}
                    symbol={extraCurrencyTransfer.currency.symbol}
                    decimals={extraCurrencyTransfer.currency.decimals}
                    isFailed={action.status === 'failed'}
                    isNegative
                />
            </ActionRow>
        </>
    );
};
