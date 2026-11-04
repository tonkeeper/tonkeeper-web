import { LedgerTransaction } from '../../../ledger/connector';
import { getLedgerAccountPathByIndex } from '../../../ledger/utils';
import { pairLedgerByNotification } from '../../pairing';
import { SignerFactory } from '../../types';
import { loadAccountOfType, pickWallet } from './_shared';

/**
 * Ledger strategy. The device speaks in batched `LedgerTransaction`
 * payloads, so the returned signer has `type: 'ledger'` (not `'cell'`)
 * and `MessageSender` routes it through the Ledger-specific pipeline.
 */
export const ledgerTonSigner: SignerFactory = async ({ sdk, accountId, walletId }) => {
    const account = await loadAccountOfType(sdk, accountId, 'ledger');
    const wallet = pickWallet(account, walletId);

    const derivation = account.allAvailableDerivations.find(d => d.activeTonWalletId === wallet.id);
    if (!derivation) {
        throw new Error('Ledger derivation not found for wallet');
    }
    const path = getLedgerAccountPathByIndex(derivation.index);

    const callback = async (transactions: LedgerTransaction[]) =>
        pairLedgerByNotification<'transaction'>(sdk, path, { transactions });
    callback.type = 'ledger' as const;
    return callback;
};
