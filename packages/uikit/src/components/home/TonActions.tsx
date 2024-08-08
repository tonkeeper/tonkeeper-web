import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { FC } from 'react';
import { useIsActiveWalletWatchOnly } from '../../state/wallet';
import { SendAction } from '../transfer/SendActionButton';
import { ActionsRow } from './Actions';
import { BuyAction } from './BuyAction';
import { ReceiveAction } from './ReceiveAction';
import { SwapAction } from './SwapAction';

export const HomeActions: FC<{ chain?: BLOCKCHAIN_NAME }> = ({ chain }) => {
    const isReadOnly = useIsActiveWalletWatchOnly();
    return (
        <ActionsRow>
            <BuyAction />
            {!isReadOnly && <SendAction asset="TON" chain={chain} />}
            <ReceiveAction />
            {!isReadOnly && <SwapAction fromAsset={TON_ASSET} />}
            {/* <SellAction sell={sell} /> */}
        </ActionsRow>
    );
};
