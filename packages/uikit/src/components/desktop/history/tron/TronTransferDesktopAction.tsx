import { FC } from 'react';

import {
    ActionRow,
    HistoryCellActionReceived,
    HistoryCellActionSent,
    HistoryCellAmount,
    HistoryCellComment,
    ErrorRow
} from '../ton/HistoryCell';
import { TronHistoryItemTransferAsset } from '@tonkeeper/core/dist/tronApi';
import { useActiveTronWallet } from '../../../../state/tron/tron';
import styled from 'styled-components';
import { HistoryGridCell } from '../ton/HistoryGrid';
import { Body2Class } from '../../../Text';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';

const HistoryCellAccount = styled(HistoryGridCell).attrs({ className: 'grid-area-account' })`
    ${Body2Class};

    color: ${p => p.theme.textSecondary};
    font-family: ${p => p.theme.fontMono};
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
`;

export const TronTransferDesktopAction: FC<{
    action: TronHistoryItemTransferAsset;
}> = ({ action }) => {
    const wallet = useActiveTronWallet();

    if (!wallet) {
        return <ErrorRow />;
    }

    const isScam = action.isScam;
    const isFailed = action.isFailed;

    if (wallet.address === action.to) {
        return (
            <>
                <HistoryCellActionReceived isScam={isScam} isFailed={isFailed} />
                <HistoryCellAccount>{toShortValue(action.from)}</HistoryCellAccount>
                <ActionRow>
                    <HistoryCellComment isScam={isScam} />
                    <HistoryCellAmount
                        amount={action.assetAmount.weiAmount.toFixed(0)}
                        symbol={action.assetAmount.asset.symbol + ' (TRC20)'}
                        decimals={action.assetAmount.asset.decimals}
                        isFailed={isFailed}
                        isSpam={isScam}
                    />
                </ActionRow>
            </>
        );
    }
    return (
        <>
            <HistoryCellActionSent isFailed={isFailed} />
            <HistoryCellAccount>{toShortValue(action.to)}</HistoryCellAccount>
            <ActionRow>
                <HistoryCellComment />
                <HistoryCellAmount
                    amount={action.assetAmount.weiAmount.toFixed(0)}
                    symbol={action.assetAmount.asset.symbol + ' (TRC20)'}
                    decimals={action.assetAmount.asset.decimals}
                    isFailed={isFailed}
                    isNegative
                />
            </ActionRow>
        </>
    );
};
