/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { blake2b256, bytesToHex, lp, utf8, concatBytes } from '../proofPrimitives';
import {
    canonicalAccountsDigest,
    computeMultichainWalletIdV2,
    deriveMultichainWalletAuth,
    isMultichainWalletIdV2,
    mintWalletAuthToken
} from '../walletAuthService';

/**
 * Golden vectors from chain-kit's `WalletRegisterProofTest.kt` — the
 * cross-language locks shared by the backend and both native apps. A
 * change in any of these means the wire format diverged from the
 * platforms, not that the test needs updating.
 */

describe('computeMultichainWalletIdV2', () => {
    it('matches the chain-kit golden vector', () => {
        const rootPub = Uint8Array.from({ length: 32 }, (_, i) => i);
        expect(computeMultichainWalletIdV2(rootPub)).toBe('aiauy3dljjynnyf647q6pc6zn2n5smet4ewq');
    });
});

describe('deriveMultichainWalletAuth', () => {
    it('derives a well-formed format-2 id from the canonical test mnemonic', async () => {
        const mnemonic =
            'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
        const { walletId, walletAuthKey } = await deriveMultichainWalletAuth(mnemonic.split(' '));
        expect(walletId).toBe('aiasvqnu3fkynjkzubjbdae5c6zbitbsqhta');
        expect(walletAuthKey).toMatch(/^[0-9a-f]{64}$/);
        expect(isMultichainWalletIdV2(walletId)).toBe(true);
    });
});

describe('isMultichainWalletIdV2', () => {
    it('rejects legacy sha256-hex ids and malformed strings', () => {
        expect(
            isMultichainWalletIdV2(
                'c557eec878dfd852ba3f88087c4f350f09c55537ab5e549c3cd14320ec3cef38'
            )
        ).toBe(false);
        expect(isMultichainWalletIdV2(undefined)).toBe(false);
        // Non-zero padding bits: a v2 id always ends with `a` or `q`.
        expect(isMultichainWalletIdV2('aiauy3dljjynnyf647q6pc6zn2n5smet4ewb')).toBe(false);
        expect(isMultichainWalletIdV2('aiauy3dljjynnyf647q6pc6zn2n5smet4ewq')).toBe(true);
    });
});

describe('mintWalletAuthToken', () => {
    const accessToken = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJkZXZpY2UifQ.c2lnbmF0dXJl';

    it('frames keeper.wallet.auth.v1 over the verbatim JWS (chain-kit vector)', () => {
        const message = concatBytes(
            lp(utf8('keeper.wallet.auth.v1')),
            lp(blake2b256(utf8(accessToken)))
        );
        expect(bytesToHex(message)).toBe(
            '156b65657065722e77616c6c65742e617574682e763120' +
                '9467d2001082e9d09ba0ea1515cd6daaab743e4b3f33df2a71c8ef1cc3949926'
        );
    });

    it('produces an 87-char unpadded base64url token over a 65-byte recoverable signature', () => {
        const key = '0101010101010101010101010101010101010101010101010101010101010101';
        const token = mintWalletAuthToken(key, accessToken);
        expect(token).toHaveLength(87);
        expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('binds the token to its access token', () => {
        const key = '0101010101010101010101010101010101010101010101010101010101010101';
        expect(mintWalletAuthToken(key, accessToken)).not.toBe(
            mintWalletAuthToken(key, `${accessToken}==`)
        );
    });
});

describe('canonicalAccountsDigest', () => {
    it('matches the cross-language digest vector', () => {
        const accounts = [
            {
                address: 'UQDdOYwHI0le-P4Rqwcr2FWc51zauTGYrmM9FZ9Z1UNy_afE',
                chain: 'ton',
                type: 'v4R2'
            },
            {
                address: 'UQAnuvvG1KVZUFw5eGTp4qaMaf--o3xh80tU0RQjHTkG80D-',
                chain: 'ton',
                type: 'v5R1'
            },
            { address: '0x7ECebAF27c989adEF9EA3DD06D316F6F463a5109', chain: 'eth' },
            {
                address: 'bc1qrhx4fcyh405fdc5l7m3g42usrz797fh2vqxs5c',
                chain: 'btc',
                type: 'p2wpkh'
            },
            { address: '0x7ECebAF27c989adEF9EA3DD06D316F6F463a5109', chain: 'arb' },
            { address: '0x7ECebAF27c989adEF9EA3DD06D316F6F463a5109', chain: 'base' },
            { address: '0x7ECebAF27c989adEF9EA3DD06D316F6F463a5109', chain: 'bsc' },
            { address: 'TKoUnkRBggFPbbsPnXqdnbjfVzRhDfnhoc', chain: 'tron' }
        ];
        expect(bytesToHex(canonicalAccountsDigest(accounts))).toBe(
            '273febf0672693aec252804a20fbf25ba9302260dec3daa2e46be7c9cf52c2df'
        );
    });

    it('is order-independent — the canonical sort normalizes the input', () => {
        const a = [
            { address: 'b', chain: 'eth' },
            { address: 'a', chain: 'ton', type: 'v5R1' }
        ];
        const b = [
            { address: 'a', chain: 'ton', type: 'v5R1' },
            { address: 'b', chain: 'eth' }
        ];
        expect(bytesToHex(canonicalAccountsDigest(a))).toBe(bytesToHex(canonicalAccountsDigest(b)));
    });
});
