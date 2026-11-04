/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import { joinUrl } from '../url';

describe('joinUrl', () => {
    it.each([
        [
            'https://swap.tonkeeper.com',
            '/v2/swap/assets',
            'https://swap.tonkeeper.com/v2/swap/assets'
        ],
        [
            'https://swap.tonkeeper.com/',
            '/v2/swap/assets',
            'https://swap.tonkeeper.com/v2/swap/assets'
        ],
        [
            'https://app.geo.tonkeeper.com/swap',
            '/v2/swap/assets',
            'https://app.geo.tonkeeper.com/swap/v2/swap/assets'
        ],
        [
            'https://app.geo.tonkeeper.com/swap/',
            'v2/swap/assets',
            'https://app.geo.tonkeeper.com/swap/v2/swap/assets'
        ],
        [
            'https://tonkeeper.com/assets/stories/prosubscriptions/',
            'eng/1.png',
            'https://tonkeeper.com/assets/stories/prosubscriptions/eng/1.png'
        ]
    ])('joins %s and %s', (base, path, expected) => {
        expect(joinUrl(base, path)).toBe(expected);
    });
});
