import { Cell } from '@ton/core';
import { sign } from '@ton/crypto';

import { IAppSdk } from '../../AppSdk';
import { AccountId } from '../../entries/account';
import { MnemonicType } from '../../entries/password';
import { WalletId } from '../../entries/wallet';
import { accountsStorage } from '../accountsStorage';
import { mnemonicToKeypair } from '../mnemonicService';
import { getAccountSecret, getMAMWalletMnemonic } from '../sign/secrets';
import { CellSigner, TronSigner } from '../sign/types';
import { tonMnemonicToTronMnemonic } from '../walletService';

export interface MigrationSigners {
    signer: CellSigner;
    tronSigner: TronSigner;
}

/**
 * Both signers the migration execution needs, unlocked with a single
 * password/keychain prompt (the natives' one-passcode-per-batch rule).
 * The source's mnemonic is read once and both the TON keypair and the
 * TRON key derive from it in memory; the strategy-registry signers are
 * not used here because each of their sign calls re-reads the secret and
 * would re-prompt for every transaction of the batch.
 */
export async function getMigrationSigners(
    sdk: IAppSdk,
    accountId: AccountId,
    walletId: WalletId,
    tronGridBaseUrl: string
): Promise<MigrationSigners> {
    const account = await accountsStorage(sdk.storage).getAccount(accountId);
    if (!account) {
        throw new Error('Account not found');
    }

    let mnemonic: string[];
    let mnemonicType: MnemonicType;
    if (account.type === 'mam') {
        mnemonic = await getMAMWalletMnemonic(sdk, accountId, walletId);
        mnemonicType = 'ton';
    } else if (account.type === 'mnemonic') {
        const secret = await getAccountSecret(sdk, accountId);
        if (secret.type !== 'mnemonic') {
            throw new Error('Unexpected secret type');
        }
        mnemonic = secret.mnemonic;
        mnemonicType = account.mnemonicType ?? 'ton';
    } else {
        throw new Error(`Account type ${account.type} cannot be migrated`);
    }

    const keyPair = await mnemonicToKeypair(mnemonic, mnemonicType);
    const signer: CellSigner = Object.assign(
        async (cell: Cell) => sign(cell.hash(), keyPair.secretKey),
        { type: 'cell' as const }
    );

    const tronSigner: TronSigner = async tx => {
        const tronMnemonic = await tonMnemonicToTronMnemonic(mnemonic, mnemonicType);
        const { TronWeb } = await import('tronweb');
        const tronWeb = new TronWeb({
            fullHost: tronGridBaseUrl,
            privateKey: TronWeb.fromMnemonic(tronMnemonic.join(' ')).privateKey.slice(2)
        });
        return tronWeb.trx.sign(tx);
    };

    return { signer, tronSigner };
}
