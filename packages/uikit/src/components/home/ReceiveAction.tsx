import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import React, { FC } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { Action } from './Actions';
import { ReceiveIcon } from './HomeIcons';

export const ReceiveAction: FC<{ chain?: BLOCKCHAIN_NAME; jetton?: string }> = ({
    chain,
    jetton
}) => {
    const sdk = useAppSdk();
    return (
        <Action
            icon={<ReceiveIcon />}
            title={'wallet_receive'}
            action={() =>
                sdk.uiEvents.emit('receive', { method: 'receive', params: { chain, jetton } })
            }
        />
    );
};
