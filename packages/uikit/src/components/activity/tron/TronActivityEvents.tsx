import { FC } from 'react';
import { ListItem } from '../../List';
import { TronHistoryItem, TronHistoryItemTransferAsset } from '@tonkeeper/core/dist/tronApi';
import { ReceiveActivityAction, SendActivityAction } from '../ActivityActionLayout';
import { useActiveTronWallet } from '../../../state/tron/tron';
import { ErrorAction } from '../CommonAction';
import { ActionStatusEnum } from '@tonkeeper/core/dist/tonApiV2';

export const TronActivityEvents: FC<{
    event: TronHistoryItem;
    formattedDate: string;
    onClick: () => void;
}> = ({ event, onClick, formattedDate }) => {
    return (
        <>
            <ListItem onClick={onClick}>
                <TronTransferAction event={event} formattedDate={formattedDate} />
            </ListItem>
        </>
    );
};

const TronTransferAction: FC<{
    event: TronHistoryItemTransferAsset;
    formattedDate: string;
}> = ({ event, formattedDate }) => {
    const wallet = useActiveTronWallet();

    if (!wallet) {
        return <ErrorAction />;
    }

    if (event.to === wallet?.address) {
        return (
            <ReceiveActivityAction
                amount={event.assetAmount.stringRelativeAmount}
                sender={event.from}
                symbol={event.assetAmount.asset.symbol}
                date={formattedDate}
                isScam={event.isScam}
                status={event.isFailed ? ActionStatusEnum.Failed : ActionStatusEnum.Ok}
            />
        );
    }
    return (
        <SendActivityAction
            amount={event.assetAmount.stringRelativeAmount}
            symbol={event.assetAmount.asset.symbol}
            recipient={event.to}
            date={formattedDate}
            isScam={event.isScam}
            status={event.isFailed ? ActionStatusEnum.Failed : ActionStatusEnum.Ok}
        />
    );
};
