/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import { createHash } from 'crypto';
import { keyPairFromSeed } from '@ton/crypto';

import { mnemonicToEd25519Seed } from '../../mnemonicService';
import { deriveMetaKeyPair } from '../meta-keys';

const BIP39_MNEMONIC = `${'abandon '.repeat(11)}about`.split(' ');

describe('deriveMetaKeyPair', () => {
    it('is deterministic for a mnemonic', async () => {
        const a = await deriveMetaKeyPair(BIP39_MNEMONIC, 'bip39');
        const b = await deriveMetaKeyPair(BIP39_MNEMONIC, 'bip39');

        expect(a.secretKey.equals(b.secretKey)).toBe(true);
    });

    it('matches the metadata-cypher derivation', async () => {
        const walletSeed = await mnemonicToEd25519Seed(BIP39_MNEMONIC, 'bip39');
        const expectedSeed = createHash('sha512')
            .update(Buffer.concat([Buffer.from('meta'), walletSeed]))
            .digest()
            .subarray(0, 32);

        const meta = await deriveMetaKeyPair(BIP39_MNEMONIC, 'bip39');

        expect(meta.publicKey.equals(keyPairFromSeed(expectedSeed).publicKey)).toBe(true);
    });
});
