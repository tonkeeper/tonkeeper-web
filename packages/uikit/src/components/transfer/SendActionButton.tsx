import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import React, { FC } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { Action } from '../home/Actions';
import { SendIcon } from '../home/HomeIcons';

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
                    params: { asset, chain }
                })
            }
        />
    );
};
