import React, { FC } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { Action } from '../home/Actions';
import { SendIcon } from '../home/HomeIcons';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';

export const SendAction: FC<{ asset?: string }> = ({ asset }) => {
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
                        chain: BLOCKCHAIN_NAME.TON,
                        from: asset === 'TON' ? 'wallet' : 'token'
                    }
                })
            }
        />
    );
};
