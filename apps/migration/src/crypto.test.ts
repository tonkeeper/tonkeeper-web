/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { decryptSecret } from './crypto';

const PASSWORD = 'password123';

const PHRASE =
    'abandon ability able about above absent absorb abstract absurd abuse access accident';

/** A phrase in today's vault: PBKDF2 → AES-GCM, salted per secret. */
const V2_VAULT =
    'v2:b53e5b61449cb99813d8111811e721d7:600000:11430e5ba7a48366eeda606e:pI4oiKBoKNuI8upMBqaHDUMhBcFDi1rfGy9K8TcSE9zqXQXKo9TF01EjcwUc5/yEGLQnBu2J7zogGbRlI88D98i4qzsVHoIMrmHryUVuXNIu3q143DIjOwo8HNrf/kNqgMGFAA==';

/** The same phrase in the format that predates it: SHA-256(password) as the key. */
const V1_VAULT =
    '3ecba13bf4e0ae0239952f881z7/43kUjLOqFWsd076VJ5hO8B/iGU0gQ70+4vkOiAlTF6DUN3Elk33qvVnx5fo2kDPXkgZ7Sa/BvDuW0NXHVWMV9V9J97SWz0dnmMGaWf/CQzM87UVDbwkFjjPlWUBjLKpOrA==';

/** A secret-key account's vault, which holds a raw key rather than words. */
const V2_SK_VAULT =
    'v2:7c16e48efeb7fa8cbbb254529f7d777a:600000:4a8a12dc9c9099077be1bb9e:I0BRE7I9+au2A+b6WjjxJCD4bpPMGmw757Iu2A1/UtDX9SCJ7K8hk9pvguFQIKtsmEc0Tnca/rlLa+VEYe6YRRTggJTDUfiGvGEnCCQGAFi/vwrwIL7zeP9Ei6JUJ7cIuFkNIAb4g2z5kME4+gTZdihS2tMIxVGUv2getdA2kUrWltL53nv4IINv1CM1XRYp';

describe('decryptSecret', () => {
    it('reads back a phrase written by the current format', async () => {
        await expect(decryptSecret(V2_VAULT, PASSWORD)).resolves.toEqual({
            type: 'mnemonic',
            mnemonic: PHRASE.split(' ')
        });
    });

    it('reads back a phrase from the format that predates it', async () => {
        await expect(decryptSecret(V1_VAULT, PASSWORD)).resolves.toEqual({
            type: 'mnemonic',
            mnemonic: PHRASE.split(' ')
        });
    });

    it('tells a raw key from a phrase by its shape', async () => {
        await expect(decryptSecret(V2_SK_VAULT, PASSWORD)).resolves.toEqual({
            type: 'sk',
            sk: 'a'.repeat(128)
        });
    });

    it('rejects a wrong password rather than returning anything', async () => {
        await expect(decryptSecret(V2_VAULT, 'not-the-password')).rejects.toThrow();
        await expect(decryptSecret(V1_VAULT, 'not-the-password')).rejects.toThrow();
    });

    it('rejects a vault it cannot make sense of', async () => {
        await expect(decryptSecret('v2:only:three', PASSWORD)).rejects.toThrow(
            'Malformed encrypted payload'
        );
        await expect(decryptSecret('v2:aabb:1000:ccdd:ZWU=', PASSWORD)).rejects.toThrow(
            'Invalid PBKDF2 iteration count'
        );
    });
});
