/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

// The real sender, so what is pinned here is the two sides agreeing, not this
// side agreeing with a copy of itself.
import {
    HANDOFF_KEYS,
    isHandoffKey as isSentKey,
    sealHandoff
} from '../../../migration/src/handoff';
import { isHandoffKey, openHandoff, PENDING_HANDOFF_TTL_MS } from './handoffOpen';
import { createHandoffRequest, PendingHandoff } from './handoffRequest';

const OLD_ORIGIN = 'https://old-origin.test';
const NEW_ORIGIN = 'https://new-origin.test';

const V2_VAULT =
    'v2:b53e5b61449cb99813d8111811e721d7:600000:11430e5ba7a48366eeda606e:pI4oiKBoKNuI8upMBqaHDUMhBcFDi1rfGy9K8TcSE9zqXQXKo9TF01EjcwUc5/yEGLQnBu2J7zogGbRlI88D98i4qzsVHoIMrmHryUVuXNIu3q143DIjOwo8HNrf/kNqgMGFAA==';

const ENTRIES = {
    accounts: [
        { id: 'a', type: 'mnemonic', auth: { kind: 'password', encryptedSecret: V2_VAULT } }
    ],
    active_account_id: 'a'
};

/** A request as this tab posts it, and the pending half it keeps. */
const request = async (): Promise<{
    nonce: string;
    publicKey: string;
    pending: PendingHandoff;
}> => {
    const { request: sent, pending } = await createHandoffRequest();

    return { ...sent, pending };
};

const seal = (
    sent: { nonce: string; publicKey: string },
    overrides: Partial<Parameters<typeof sealHandoff>[0]> = {}
) =>
    sealHandoff({
        request: { nonce: sent.nonce, publicKey: sent.publicKey },
        entries: ENTRIES,
        from: OLD_ORIGIN,
        to: NEW_ORIGIN,
        ...overrides
    });

describe('opening a handoff', () => {
    it('opens what the old origin sealed to this tab', async () => {
        const sent = await request();
        const fragment = await seal(sent);

        await expect(openHandoff({ payload: fragment, pending: sent.pending })).resolves.toEqual({
            ok: true,
            entries: ENTRIES
        });
    });

    it('rejects a payload whose compression flag was flipped', async () => {
        const sent = await request();
        const fragment = (await seal(sent)).replace(/^v1\.z\./, 'v1.r.');

        // The flag is part of the associated data.
        await expect(openHandoff({ payload: fragment, pending: sent.pending })).resolves.toEqual({
            ok: false,
            reason: 'decrypt'
        });
    });

    it('rejects a payload when this tab sent no request', async () => {
        const sent = await request();

        await expect(
            openHandoff({ payload: await seal(sent), pending: undefined })
        ).resolves.toEqual({ ok: false, reason: 'no-request' });
    });

    it('rejects a payload sealed to another request', async () => {
        const other = await request();
        const fragment = await seal(other);
        const mine = await request();

        await expect(openHandoff({ payload: fragment, pending: mine.pending })).resolves.toEqual({
            ok: false,
            reason: 'decrypt'
        });
    });

    it('rejects a payload carrying another nonce, even to this key', async () => {
        const sent = await request();
        const fragment = await seal({ ...sent, nonce: 'AAAAAAAAAAAAAAAAAAAAAA' });

        await expect(openHandoff({ payload: fragment, pending: sent.pending })).resolves.toEqual({
            ok: false,
            reason: 'decrypt'
        });
    });

    it('rejects a payload sealed between any other pair of origins', async () => {
        const sent = await request();

        for (const pair of [{ from: 'https://attacker.test' }, { to: 'https://attacker.test' }]) {
            await expect(
                openHandoff({ payload: await seal(sent, pair), pending: sent.pending })
            ).resolves.toEqual({ ok: false, reason: 'decrypt' });
        }
    });

    it('rejects a tampered ciphertext', async () => {
        const sent = await request();
        const fragment = await seal(sent);
        // Well inside the ciphertext: the last base64 character can carry
        // padding bits that decode to the same bytes either way.
        const at = fragment.length - 10;
        const tampered =
            fragment.slice(0, at) + (fragment[at] === 'A' ? 'B' : 'A') + fragment.slice(at + 1);

        await expect(openHandoff({ payload: tampered, pending: sent.pending })).resolves.toEqual({
            ok: false,
            reason: 'decrypt'
        });
    });

    it('rejects an answer to a request older than its lifetime', async () => {
        const sent = await request();
        const fragment = await seal(sent);

        await expect(
            openHandoff({
                payload: fragment,
                pending: sent.pending,
                now: sent.pending.createdAt + PENDING_HANDOFF_TTL_MS + 1
            })
        ).resolves.toEqual({ ok: false, reason: 'expired' });
    });

    it('rejects anything not shaped like a payload before deriving a key', async () => {
        const sent = await request();

        for (const fragment of ['', 'none', 'v2.z.a.b.c', 'v1.z.short.iv.ct']) {
            await expect(
                openHandoff({ payload: fragment, pending: sent.pending })
            ).resolves.toEqual({
                ok: false,
                reason: 'malformed'
            });
        }
    });

    // The sender's allowlist is not trusted to have run: a key outside this
    // side's own list is dropped however it got into the payload.
    it('drops keys outside its own allowlist', async () => {
        const sent = await request();
        const fragment = await seal(sent, {
            entries: { ...ENTRIES, meta_encryption_map: { a: 'key' }, pro_auth_token: 't' }
        });

        await expect(openHandoff({ payload: fragment, pending: sent.pending })).resolves.toEqual({
            ok: true,
            entries: ENTRIES
        });
    });

    it('rejects a payload whose vault is not in the current format', async () => {
        const sent = await request();
        const fragment = await seal(sent, {
            entries: {
                accounts: [
                    { id: 'a', type: 'mnemonic', auth: { kind: 'password', encryptedSecret: 1 } }
                ]
            }
        });

        await expect(openHandoff({ payload: fragment, pending: sent.pending })).resolves.toEqual({
            ok: false,
            reason: 'legacy-vault'
        });
    });
});

describe('the two allowlists', () => {
    it('agree on every exact key', () => {
        for (const key of HANDOFF_KEYS) {
            expect(isHandoffKey(key)).toBe(true);
        }
    });

    it.each([
        'wallet_config_0:abc_-239',
        'account_config_a',
        'connections_a_-239',
        'favourites_abc',
        'hidden_suggestions_abc',
        'multichain_favorite_recipients_a',
        'two_fa_wallet_config::a',
        `wallet_${'a'.repeat(64)}`,
        `mnemonic_${'a'.repeat(64)}`,
        'meta_encryption_map',
        'touch_id',
        'pro_auth_token',
        'battery_auth_token',
        'multichain_device_certificate',
        'multichain_device_tokens',
        'user_id',
        'migrated_at',
        'wallet_not-a-key'
    ])('agree on %s', key => {
        expect(isHandoffKey(key)).toBe(isSentKey(key));
    });
});
