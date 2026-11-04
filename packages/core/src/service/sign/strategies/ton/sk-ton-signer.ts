import { Cell } from '@ton/core';

import { signWithSecret } from '../..';
import { getAccountSecret } from '../../secrets';
import { SignerFactory } from '../../types';
import { loadAccountOfType } from './_shared';

/**
 * Strategy for secret-key accounts. The stored secret is fed through
 * `signWithSecret`, which dispatches by `account.signingAlgorithm`
 * (currently only ed25519 in production).
 */
export const skTonSigner: SignerFactory = async ({ sdk, accountId }) => {
    const account = await loadAccountOfType(sdk, accountId, 'sk');
    const secret = await getAccountSecret(sdk, accountId);
    if (secret.type !== 'sk') {
        throw new Error('Unexpected secret type');
    }

    const callback = (message: Cell) => {
        return signWithSecret(message.hash(), {
            key: secret.sk,
            algorithm: account.signingAlgorithm
        });
    };
    callback.type = 'cell' as const;
    return callback;
};
