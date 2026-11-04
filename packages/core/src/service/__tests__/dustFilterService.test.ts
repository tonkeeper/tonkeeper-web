/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { MemoryStorage } from '../../Storage';
import { getDustFilterState, setDustFilterState } from '../dustFilterService';

describe('dustFilterService', () => {
    it('defaults history off and balances on', async () => {
        const storage = new MemoryStorage();
        await expect(getDustFilterState(storage)).resolves.toEqual({
            hideDustActivities: false,
            hideDustBalances: true
        });
    });

    it('persists a partial change without touching the other toggle', async () => {
        const storage = new MemoryStorage();
        await setDustFilterState(storage, { hideDustActivities: true });
        await setDustFilterState(storage, { hideDustBalances: true });
        await setDustFilterState(storage, { hideDustActivities: false });
        await expect(getDustFilterState(storage)).resolves.toEqual({
            hideDustActivities: false,
            hideDustBalances: true
        });
    });

    it('fills missing fields of a partially stored state with defaults', async () => {
        const storage = new MemoryStorage();
        await storage.set('multichain_dust_filters', { hideDustActivities: true });
        await expect(getDustFilterState(storage)).resolves.toEqual({
            hideDustActivities: true,
            hideDustBalances: true
        });
    });
});
