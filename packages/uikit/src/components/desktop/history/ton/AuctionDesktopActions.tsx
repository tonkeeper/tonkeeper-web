import React, { FC } from 'react';
import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { useTranslation } from '../../../../hooks/translation';
import {
    ActionRow,
    ErrorRow,
    HistoryCellAccount,
    HistoryCellActionGeneric,
    HistoryCellAmount,
    HistoryCellComment
} from './HistoryCell';
import { HammerIcon } from '../../../Icon';

export const AuctionBidDesktopAction: FC<{
    action: Action;
}> = ({ action }) => {
    const { auctionBid } = action;
    const { t } = useTranslation();

    if (!auctionBid) {
        return <ErrorRow />;
    }

    const isFailed = action.status === 'failed';

    return (
        <>
            <HistoryCellActionGeneric icon={<HammerIcon color="iconPrimary" />} isFailed={isFailed}>
                {t('transaction_type_bid')}
            </HistoryCellActionGeneric>
            <HistoryCellAccount account={auctionBid.auction} />
            <ActionRow>
                <HistoryCellComment comment={auctionBid.auctionType} />
                <HistoryCellAmount
                    amount={auctionBid.amount.value}
                    symbol={auctionBid.amount.tokenName}
                    decimals={9}
                    isFailed={isFailed}
                    isNegative
                />
            </ActionRow>
        </>
    );
};
