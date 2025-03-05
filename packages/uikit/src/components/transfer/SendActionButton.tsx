import React, { FC } from 'react';
import { Action } from '../home/Actions';
import { SendIcon } from '../home/HomeIcons';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { useAppSdk } from '../../hooks/appSdk';
import { TransferInitParams } from '@tonkeeper/core/dist/AppSdk';

export const SendAction: FC<{ asset?: string; chain?: BLOCKCHAIN_NAME }> = ({ asset, chain }) => {
    const sdk = useAppSdk();

    return (
        <Action
            icon={<SendIcon />}
            title={'wallet_send'}
            action={() =>
                sdk.uiEvents.emit('transfer', {
                    method: 'transfer',
                    id: Date.now(),
                    params: {
                        jetton: asset,
                        chain: chain,
                        from: asset === 'TON' ? 'wallet' : 'token'
                    } as TransferInitParams
                })
            }
        />
    );
};
