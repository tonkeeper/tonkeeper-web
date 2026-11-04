import { AppKey } from '../Keys';
import { IStorage } from '../Storage';

/**
 * The per-install dust-filter toggles, mirroring the native apps' two
 * independent settings: `hideDustActivities` drives the history feed
 * ("Hide tiny transfers"), `hideDustBalances` the asset lists and the
 * totals derived from them ("Hide assets with no cost"). History defaults
 * off like the native apps — the backend also drops fee-only activities
 * such as domain renewals under `hide_dust`, which contradicts its spec
 * and would hide them from a fresh install. Balances default on, a web
 * product decision Android does not share.
 *
 * Filtering happens server-side via the `hide_dust` query flag — both
 * lists are cursor-paginated, so dropping rows client-side would yield
 * short and empty pages. Dust is anything worth $0.01 or less; tokens
 * the backend cannot price count as dust too.
 */
export interface DustFilterState {
    hideDustActivities: boolean;
    hideDustBalances: boolean;
}

export const DEFAULT_DUST_FILTERS: DustFilterState = {
    hideDustActivities: false,
    hideDustBalances: true
};

export async function getDustFilterState(storage: IStorage): Promise<DustFilterState> {
    const stored = await storage.get<Partial<DustFilterState>>(AppKey.MULTICHAIN_DUST_FILTERS);
    return { ...DEFAULT_DUST_FILTERS, ...stored };
}

export async function setDustFilterState(
    storage: IStorage,
    change: Partial<DustFilterState>
): Promise<DustFilterState> {
    const next = { ...(await getDustFilterState(storage)), ...change };
    await storage.set(AppKey.MULTICHAIN_DUST_FILTERS, next);
    return next;
}
