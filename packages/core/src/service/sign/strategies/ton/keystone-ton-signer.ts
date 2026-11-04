import { Cell } from '@ton/core';

import { pairKeystoneByNotification } from '../../pairing';
import { SignerFactory } from '../../types';
import { loadAccountOfType } from './_shared';

/**
 * Keystone strategy. Forwards the raw transfer cell to the paired
 * Keystone device via UI notification and returns the hex signature.
 */
export const keystoneTonSigner: SignerFactory = async ({ sdk, accountId }) => {
    const account = await loadAccountOfType(sdk, accountId, 'keystone');

    const callback = async (message: Cell) => {
        const result = await pairKeystoneByNotification(
            sdk,
            message.toBoc({ idx: false }),
            'transaction',
            account.pathInfo
        );
        return Buffer.from(result, 'hex');
    };
    callback.type = 'cell' as const;
    return callback;
};
