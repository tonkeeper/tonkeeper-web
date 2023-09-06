import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import React, { FC } from 'react';
import { useAppContext } from '../../hooks/appContext';
import { useTonenpointFiatMethods } from '../../state/tonendpoint';
import { SendAction } from '../transfer/SendNotifications';
import { ActionsRow } from './Actions';
import { BuyAction } from './BuyAction';
import { ReceiveAction } from './ReceiveAction';

export const HomeActions: FC<{ chain?: BLOCKCHAIN_NAME }> = ({ chain }) => {
    const { tonendpoint } = useAppContext();
    const { data: methods } = useTonenpointFiatMethods(tonendpoint);

    const buy = methods && methods.categories[0];
    // const sell = methods && methods.categories[1];

    return (
        <ActionsRow>
            <BuyAction buy={buy} />
            <SendAction asset="TON" chain={chain} />
            <ReceiveAction />
            {/* <SellAction sell={sell} /> */}
        </ActionsRow>
    );
};
