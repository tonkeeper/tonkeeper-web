/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import { parseInterceptableTransferLink } from '../tonTransferLink';

const ADDRESS = 'UQBjJ0bZXqVHAXNtA6aLgPPEq7FIG-a2YXKOWaO3T3MyG2wF';

describe('parseInterceptableTransferLink', () => {
    it.each([
        `ton://transfer/${ADDRESS}`,
        `ton://transfer/${ADDRESS}?amount=1000&text=hello`,
        `ton://transfer/${ADDRESS}/`,
        `ton://transfer/foundation.ton`,
        `https://app.tonkeeper.com/transfer/${ADDRESS}`,
        `https://app.tonkeeper.com/transfer/${ADDRESS}?amount=1000&jetton=EQx`
    ])('accepts %s', href => {
        expect(parseInterceptableTransferLink(href)).toBe(new URL(href).href);
    });

    it('returns the normalized link', () => {
        expect(parseInterceptableTransferLink(`ton://transfer/x/../${ADDRESS}`)).toBe(
            `ton://transfer/${ADDRESS}`
        );
    });

    it.each([
        undefined,
        42,
        '',
        'not a url',
        'ton://transfer',
        'ton://transfer/',
        `ton://transfer/${ADDRESS}/extra`,
        `ton://transfer//${ADDRESS}`,
        'ton://backup',
        'ton://browser?network=eth',
        'ton://swap?ft=TON',
        `ton://staking/${ADDRESS}`,
        `tonkeeper://transfer/${ADDRESS}`,
        `http://app.tonkeeper.com/transfer/${ADDRESS}`,
        `https://app.tonkeeper.com/backup`,
        `https://app.tonkeeper.com/transfer`,
        `https://app.tonkeeper.com/transfer/${ADDRESS}/extra`,
        `https://app.tonkeeper.com:8443/transfer/${ADDRESS}`,
        `https://user@app.tonkeeper.com/transfer/${ADDRESS}`,
        `https://app.tonkeeper.com.example.com/transfer/${ADDRESS}`,
        `https://example.com/transfer/${ADDRESS}`,
        `javascript:alert(1)//ton://transfer/${ADDRESS}`
    ])('rejects %s', href => {
        expect(parseInterceptableTransferLink(href)).toBeNull();
    });
});
