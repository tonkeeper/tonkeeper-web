/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, describe, expect, it } from 'vitest';

import {
    _resetMultichainEndpointsForTests,
    applyMultichainEndpoints,
    multichainApiBaseUrl,
    multichainApiOrigin,
    tradingApiOrigin
} from '../multichainEndpoints';

describe('multichainEndpoints', () => {
    afterEach(() => _resetMultichainEndpointsForTests());

    it('serves the compiled hosts until the boot config answers', () => {
        expect(multichainApiOrigin()).toBe('https://multi.tonkeeper.com');
        expect(multichainApiBaseUrl()).toBe('https://multi.tonkeeper.com/api/v1');
        expect(tradingApiOrigin()).toBe('https://trading.tonkeeper.com');
    });

    it('takes the regional hosts from the boot config blocks', () => {
        applyMultichainEndpoints({
            multichain: {
                domain: 'https://block-multi.tonkeeper.com/',
                realtime: 'wss://block-rt.tonkeeper.com/connection/websocket'
            },
            trading: { domain: 'https://block-trading.tonkeeper.com' }
        });

        expect(multichainApiBaseUrl()).toBe('https://block-multi.tonkeeper.com/api/v1');
        expect(tradingApiOrigin()).toBe('https://block-trading.tonkeeper.com');
    });

    it('keeps the compiled host for an absent or malformed block', () => {
        applyMultichainEndpoints({
            multichain: { domain: 'not a url' },
            trading: { domain: 'javascript:alert(1)' }
        });
        expect(multichainApiOrigin()).toBe('https://multi.tonkeeper.com');
        expect(tradingApiOrigin()).toBe('https://trading.tonkeeper.com');

        applyMultichainEndpoints({ multichain: { domain: 'https://block-multi.tonkeeper.com' } });
        applyMultichainEndpoints({});
        expect(multichainApiOrigin()).toBe('https://multi.tonkeeper.com');
    });
});
