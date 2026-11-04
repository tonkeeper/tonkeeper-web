/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { SAFE_MODE_AUTO_REENABLE_MS, resolveSafeModeState } from '../safeModeService';

const NOW = 1_756_000_000_000;

describe('resolveSafeModeState', () => {
    it('follows the server default when nothing is stored', () => {
        expect(resolveSafeModeState(undefined, true, NOW)).toEqual({
            enabled: true,
            temporarilyDisabled: false
        });
        expect(resolveSafeModeState(undefined, false, NOW)).toEqual({
            enabled: false,
            temporarilyDisabled: false
        });
    });

    it('an explicit choice overrides the server default', () => {
        expect(resolveSafeModeState({ type: 'enabled' }, false, NOW).enabled).toBe(true);
        expect(resolveSafeModeState({ type: 'disabled-permanently' }, true, NOW).enabled).toBe(
            false
        );
    });

    it('a temporary disable holds for 24 hours', () => {
        const stored = { type: 'disabled', disabledAtMs: NOW } as const;
        expect(resolveSafeModeState(stored, true, NOW)).toEqual({
            enabled: false,
            temporarilyDisabled: true
        });
        expect(
            resolveSafeModeState(stored, true, NOW + SAFE_MODE_AUTO_REENABLE_MS - 1)
                .temporarilyDisabled
        ).toBe(true);
    });

    it('re-enables itself once the 24-hour window passes', () => {
        const stored = { type: 'disabled', disabledAtMs: NOW } as const;
        expect(resolveSafeModeState(stored, false, NOW + SAFE_MODE_AUTO_REENABLE_MS)).toEqual({
            enabled: true,
            temporarilyDisabled: false
        });
    });
});
