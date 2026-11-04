/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import type { AccountConnection } from '../connectionService';
import { walletIdOfClientSession } from '../sessionOwner';

const http = (clientSessionId: string): AccountConnection => ({
    id: 'https://example.com/manifest.json',
    type: 'http',
    manifest: { url: 'https://example.com', name: 'Example', iconUrl: '' },
    sessionKeyPair: { publicKey: 'pub', secretKey: 'sec' },
    clientSessionId,
    connectItems: []
});

describe('walletIdOfClientSession', () => {
    it('returns the only wallet holding the session', () => {
        expect(
            walletIdOfClientSession(
                [
                    { wallet: { id: 'a' }, connections: [http('s1')] },
                    { wallet: { id: 'b' }, connections: [http('s2')] }
                ],
                's2'
            )
        ).toBe('b');
    });

    it('returns undefined for an unknown session', () => {
        expect(
            walletIdOfClientSession([{ wallet: { id: 'a' }, connections: [http('s1')] }], 's2')
        ).toBeUndefined();
    });

    it('returns undefined when several wallets hold the session', () => {
        expect(
            walletIdOfClientSession(
                [
                    { wallet: { id: 'a' }, connections: [http('s1')] },
                    { wallet: { id: 'b' }, connections: [http('s1')] }
                ],
                's1'
            )
        ).toBeUndefined();
    });
});
