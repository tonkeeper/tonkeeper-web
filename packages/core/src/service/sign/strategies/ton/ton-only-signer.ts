import { Cell } from '@ton/core';

import { AppKey } from '../../../../Keys';
import { TonWalletStandard } from '../../../../entries/wallet';
import { assertUnreachable } from '../../../../utils/types';
import { delay } from '../../../../utils/common';
import { createSignerTxDeepLink, parseSignerSignature } from '../../../signerService';
import { pairSignerByNotification } from '../../pairing';
import { SignerFactory } from '../../types';
import { loadAccountOfType, pickWallet } from './_shared';

/**
 * Strategy for `ton-only` accounts (no local keypair, signature comes
 * back from an external Signer via QR or deeplink). Two auth shapes:
 *
 * - `signer` — pair via in-app notification; user scans a QR with the
 *   external Signer app, the signature returns through `uiEvents`.
 * - `signer-deeplink` — open a deeplink to the Signer app. The web
 *   target navigates the window (no return path; UI resumes via stored
 *   message); other targets wait for `signerTxResponse` on `uiEvents`.
 */
export const tonOnlyTonSigner: SignerFactory = async ({ sdk, accountId, walletId }) => {
    const account = await loadAccountOfType(sdk, accountId, 'ton-only');
    const wallet = pickWallet(account, walletId) as TonWalletStandard;

    if (account.auth.kind === 'signer') {
        const callback = async (message: Cell) => {
            const result = await pairSignerByNotification(
                sdk,
                message.toBoc({ idx: false }).toString('base64'),
                wallet
            );
            return parseSignerSignature(result);
        };
        callback.type = 'cell' as const;
        return callback;
    }

    if (account.auth.kind === 'signer-deeplink') {
        if (sdk.targetEnv === 'web') {
            const callback = async (message: Cell) => {
                const messageBase64 = message.toBoc({ idx: false }).toString('base64');
                await sdk.storage.set(AppKey.SIGNER_MESSAGE, messageBase64);

                const deeplink = await createSignerTxDeepLink(
                    sdk,
                    wallet.publicKey,
                    wallet.version,
                    messageBase64
                );

                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                window.location = deeplink as any;

                await delay(2000);

                throw new Error('Navigate to deeplink');
            };
            callback.type = 'cell' as const;
            return callback;
        }

        const callback = async (message: Cell) => {
            const deeplink = await createSignerTxDeepLink(
                sdk,
                wallet.publicKey,
                wallet.version,
                message.toBoc({ idx: false }).toString('base64')
            );

            sdk.openPage(deeplink);

            return new Promise<Buffer>(res => {
                sdk.uiEvents.once('signerTxResponse', options => {
                    res(Buffer.from(options.params.signatureHex, 'hex'));
                });
            });
        };
        callback.type = 'cell' as const;
        return callback;
    }

    return assertUnreachable(account.auth);
};
