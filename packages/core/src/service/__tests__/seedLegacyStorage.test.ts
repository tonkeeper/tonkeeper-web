/* eslint-disable import/no-extraneous-dependencies */
import { execFile } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { mnemonicNew } from '@ton/crypto';
import { beforeAll, describe, expect, it } from 'vitest';

import { AccountTonMnemonic, bindAccountToClass } from '../../entries/account';
import { Network } from '../../entries/network';
import { WalletVersion } from '../../entries/wallet';
import { AppKey } from '../../Keys';
import { decrypt } from '../cryptoService';
import { walletContract } from '../wallet/contractService';

const execFileAsync = promisify(execFile);

const SCRIPT = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../../scripts/seedLegacyStorage.mjs'
);

const PASSWORD = 'seed-test-password';

/**
 * `seedLegacyStorage.mjs` runs under bare `node` so it can seed a deployed
 * origin with no build step, which means it restates the vault format, the
 * address derivation and the stored account shape rather than importing them.
 * These tests keep those copies honest: they run the script for real and check
 * its output against the app's own `cryptoService`, `contractService` and
 * account model.
 */
describe('seedLegacyStorage script', () => {
    let mnemonic: string[];

    beforeAll(async () => {
        mnemonic = await mnemonicNew(24);
    }, 60_000);

    const seed = async (versions: string) => {
        const { stdout } = await execFileAsync('node', [
            SCRIPT,
            '--json',
            '--password',
            PASSWORD,
            '--versions',
            versions,
            '--mnemonic',
            mnemonic.join(' ')
        ]);

        const storage = JSON.parse(stdout) as Record<string, string>;
        const [account] = JSON.parse(storage[`tonkeeper_${AppKey.ACCOUNTS}`])
            .payload as AccountTonMnemonic[];

        bindAccountToClass(account);

        return { storage, account };
    };

    it('writes the keys BrowserStorage reads', async () => {
        const { storage, account } = await seed('v4R2,v5R1');

        expect(Object.keys(storage).sort()).toEqual(
            [`tonkeeper_${AppKey.ACCOUNTS}`, `tonkeeper_${AppKey.ACTIVE_ACCOUNT_ID}`].sort()
        );
        expect(JSON.parse(storage[`tonkeeper_${AppKey.ACTIVE_ACCOUNT_ID}`]).payload).toBe(
            account.id
        );
        expect(account.type).toBe('mnemonic');
    }, 30_000);

    it('encrypts the mnemonic in a vault cryptoService can open', async () => {
        const { account } = await seed('v4R2');

        expect(account.auth.kind).toBe('password');
        const { encryptedSecret } = account.auth as { encryptedSecret: string };

        await expect(decrypt(encryptedSecret, PASSWORD)).resolves.toBe(mnemonic.join(' '));
        await expect(decrypt(encryptedSecret, 'wrong-password')).rejects.toThrow();
    }, 30_000);

    it('derives the same addresses as the wallet contract strategy', async () => {
        const { account } = await seed('v3R2,v4R2,v5R1');

        expect(account.allTonWallets.map(w => w.version)).toEqual([
            WalletVersion.V3R2,
            WalletVersion.V4R2,
            WalletVersion.V5R1
        ]);

        account.allTonWallets.forEach(wallet => {
            const expected = walletContract(
                wallet.publicKey,
                wallet.version,
                Network.MAINNET
            ).address.toRawString();

            expect(wallet.rawAddress).toBe(expected);
            // On mainnet a wallet id is its raw address, per `walletService`.
            expect(wallet.id).toBe(expected);
        });
    }, 30_000);

    it('activates the highest version, as the create flow does', async () => {
        const { account } = await seed('v3R2,v5R1,v4R2');

        expect(account.activeTonWallet.version).toBe(WalletVersion.V5R1);
        // An account id is the TON public key of its mnemonic.
        expect(account.id).toBe(account.activeTonWallet.publicKey);
    }, 30_000);
});
