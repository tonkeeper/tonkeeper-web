import { ActionStatusEnum } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC, PropsWithChildren } from 'react';
import { useFormatFiat, useUSDTRate } from '../../../state/rates';
import { ListBlock } from '../../List';
import { ActivityDetailsHeader } from '../ActivityDetailsLayout';
import {
    ActionFeeDetails,
    ActionRecipientAddress,
    ActionSenderAddress,
    ActionTransactionDetails,
    CommonActionDetailsBlock
} from '../NotificationCommon';
import { useActiveTronWallet } from '../../../state/tron/tron';
import { ActivityNotificationDataTron } from '../ton/ActivityNotification';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

const TronActionDetailsBlock: FC<PropsWithChildren<{ transactionHash: string }>> = ({
    transactionHash,
    children
}) => {
    const url = 'https://tronscan.org/#/transaction/%s';
    return (
        <CommonActionDetailsBlock url={url} eventId={transactionHash}>
            {children}
        </CommonActionDetailsBlock>
    );
};

export const TronTransferActionNotification: FC<ActivityNotificationDataTron> = ({
    timestamp,
    event
}) => {
    const wallet = useActiveTronWallet()!;
    const { data: rate } = useUSDTRate();
    const { fiatAmount } = useFormatFiat(rate, event.assetAmount.relativeAmount);

    const isScam = event.isScam;
    const kind = event.to === wallet.address ? 'received' : 'send';

    return (
        <TronActionDetailsBlock transactionHash={event.transactionHash}>
            <ActivityDetailsHeader
                isScam={isScam}
                decimals={event.assetAmount.asset.decimals}
                amount={event.assetAmount.weiAmount.toFixed(0)}
                symbol={event.assetAmount.asset.symbol}
                total={
                    event.assetAmount.asset.address === TRON_USDT_ASSET.address
                        ? fiatAmount
                        : undefined
                }
                timestamp={timestamp}
                kind={kind}
                status={event.isFailed ? ActionStatusEnum.Failed : ActionStatusEnum.Ok}
            />
            <ListBlock margin={false} fullWidth>
                {kind === 'received' && <ActionSenderAddress address={event.from} />}
                {kind === 'send' && <ActionRecipientAddress address={event.to} />}
                <ActionTransactionDetails eventId={event.transactionHash} />
                {!!event.fee && <ActionFeeDetails fee={event.fee} />}
            </ListBlock>
        </TronActionDetailsBlock>
    );
};
