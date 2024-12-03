import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { FC } from 'react';
import { useActiveTonNetwork, useIsActiveWalletWatchOnly } from '../../state/wallet';
import { SendAction } from '../transfer/SendActionButton';
import { ActionsRow } from './Actions';
import { BuyAction } from './BuyAction';
import { ReceiveAction } from './ReceiveAction';
import { SwapAction } from './SwapAction';
import { Network } from '@tonkeeper/core/dist/entries/network';

export const HomeActions: FC<{ chain?: BLOCKCHAIN_NAME }> = () => {
    const isReadOnly = useIsActiveWalletWatchOnly();
    const network = useActiveTonNetwork();
    const isTestnet = network === Network.TESTNET;
    return (
        <ActionsRow>
            {!isTestnet && <BuyAction />}
            {!isReadOnly && <SendAction asset="TON" />}
            <ReceiveAction />
            {!isTestnet && !isReadOnly && <SwapAction fromAsset={TON_ASSET} />}
            {/* <SellAction sell={sell} /> */}
        </ActionsRow>
    );
};
