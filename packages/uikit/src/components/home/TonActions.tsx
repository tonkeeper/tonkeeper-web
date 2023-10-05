import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import React, { FC } from 'react';
import { SendAction } from '../transfer/SendActionButton';
import { ActionsRow } from './Actions';
import { BuyAction } from './BuyAction';
import { ReceiveAction } from './ReceiveAction';

export const HomeActions: FC<{ chain?: BLOCKCHAIN_NAME }> = ({ chain }) => {
    return (
        <ActionsRow>
            <BuyAction />
            <SendAction asset="TON" chain={chain} />
            <ReceiveAction />
            {/* <SellAction sell={sell} /> */}
        </ActionsRow>
    );
};
