import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import React, { FC } from 'react';
import { SendAction } from '../transfer/SendActionButton';
import { ActionsRow } from './Actions';
import { BuyAction } from './BuyAction';
import { ReceiveAction } from './ReceiveAction';
import { SwapAction } from './SwapAction';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

export const HomeActions: FC<{ chain?: BLOCKCHAIN_NAME }> = ({ chain }) => {
    return (
        <ActionsRow>
            <BuyAction />
            <SendAction asset="TON" chain={chain} />
            <ReceiveAction />
            <SwapAction fromAsset={TON_ASSET} />
            {/* <SellAction sell={sell} /> */}
        </ActionsRow>
    );
};
