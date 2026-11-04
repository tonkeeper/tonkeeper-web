/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import { toDeeplinkOpenEvent } from '../deeplink-open';

const linkType = (link: string) => toDeeplinkOpenEvent(link, false)?.link_type;

describe('toDeeplinkOpenEvent', () => {
    it('tells app links from universal links', () => {
        expect(toDeeplinkOpenEvent('tonkeeper://swap', true)).toEqual({
            eventName: 'deeplink_open',
            from: 'app_link',
            link_type: 'swap',
            is_cold_start: true
        });
        expect(toDeeplinkOpenEvent('https://app.tonkeeper.com/swap', false)?.from).toBe(
            'universal_link'
        );
    });

    it('reads the destination from the first path segment', () => {
        expect(linkType('ton://transfer/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c')).toBe(
            'transfer'
        );
        expect(linkType('https://app.tonkeeper.com/pro/staking')).toBe('staking');
        expect(linkType('tonkeeper://buy-ton')).toBe('deposit');
        expect(linkType('tonkeeper://migrate')).toBe('migration');
        expect(linkType('tonkeeper://assets/ton/mainnet/coin')).toBe('trade_asset');
        expect(linkType('tonkeeper://add-wallet')).toBe('add_wallet');
        expect(linkType('tonkeeper://signer/sign?body=1')).toBe('external_sign');
        expect(linkType('tonkeeper://story/abc')).toBe('story');
    });

    it('reports a bare link as main and an unparseable one as unknown', () => {
        expect(linkType('tonkeeper://')).toBe('main');
        expect(linkType('tonkeeper://nowhere')).toBe('unknown');
        expect(linkType('not a link')).toBe('unknown');
    });

    it('recognises TonConnect requests on every scheme', () => {
        const query = '?v=2&id=abc&r=%7B%7D';
        expect(linkType(`tc://${query}`)).toBe('tonconnect');
        expect(linkType(`https://app.tonkeeper.com/ton-connect${query}`)).toBe('tonconnect');
        expect(linkType('tc://?v=1')).toBe('unknown');
    });

    it('recognises WalletConnect pairings and chain transfer links', () => {
        const topic = 'a'.repeat(64);
        expect(
            linkType(`tonkeeper://wc?uri=${encodeURIComponent(`wc:${topic}@2?relay-protocol=irn`)}`)
        ).toBe('wallet_connect');
        expect(linkType('ethereum:0x' + '1'.repeat(40))).toBe('transfer');
    });

    it('skips links that only bring the app to the foreground', () => {
        expect(toDeeplinkOpenEvent('tc://?ret=back', false)).toBeNull();
        expect(toDeeplinkOpenEvent('https://app.tonkeeper.com/wc?requestId=1', false)).toBeNull();
        expect(toDeeplinkOpenEvent('', true)).toBeNull();
    });
});
