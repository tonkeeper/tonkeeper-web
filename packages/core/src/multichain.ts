import { ChainId } from './chains/types';

/**
 * Single source of truth for the multichain feature gate, used by every
 * app shell to populate `AppContext.multichainEnabled`.
 *
 * ## Contract
 *
 * `true` is the only supported value — it is what production ships and
 * the only state the app is tested in. `false` survives as a dev-time
 * convenience for diffing against pre-multichain behaviour and is
 * slated for removal along with every branch that reads it; nothing may
 * rely on it, and "it's fine because the flag can be off" is never a
 * valid justification for a broken `true` path.
 *
 * The flag's one remaining job is the **creation fork**: what account
 * type a brand-new wallet becomes.
 *
 * - **Create** — `true` generates a BIP39 mnemonic and an
 *   `AccountMultichain` with TON + EVM + BTC + TRON wallets; `false`
 *   generates a TON mnemonic and an `AccountTonMnemonic`.
 * - **Import** — decided by the phrase, not the flag: TON mnemonic →
 *   `AccountTonMnemonic`, MAM → `AccountMAM`, BIP39 →
 *   `AccountMultichain` (`AccountTonMnemonic` when the flag is off).
 * - **Everything else** — hardware pairings, watch-only, testnet, MAM
 *   and multisig creation are flag-independent and produce their own
 *   account types. Already-created accounts render per their account
 *   type, so flipping the flag never changes an existing wallet.
 */
export const MULTICHAIN_ENABLED = true;

/**
 * Query-param escape hatch for enabling the multichain preview on a build
 * compiled with `MULTICHAIN_ENABLED = false`.
 *
 * Deliberately non-obvious so it isn't stumbled upon: append `?tk-labs=multichain`
 * to the URL to turn the preview on, `?tk-labs=off` to turn it back off. The
 * choice is persisted to `localStorage` so it survives client-side navigation
 * and reloads without re-appending the param.
 *
 * This is a preview gate, not a security boundary — it only flips the same
 * `AppContext.multichainEnabled` value the constant feeds, so an enabled preview
 * is byte-for-byte the `true` build. It has no effect on shells without a URL
 * query string (desktop, extension popup, mobile), which read the constant.
 */
const MULTICHAIN_PREVIEW_PARAM = 'tk-labs';
const MULTICHAIN_PREVIEW_ON = 'multichain';
const MULTICHAIN_PREVIEW_OFF = 'off';
const MULTICHAIN_PREVIEW_STORAGE_KEY = 'tk-labs-multichain';

export const isMultichainEnabled = (): boolean => {
    if (MULTICHAIN_ENABLED) {
        return true;
    }

    if (typeof window === 'undefined') {
        return false;
    }

    try {
        const param = new URLSearchParams(window.location.search).get(MULTICHAIN_PREVIEW_PARAM);

        if (param === MULTICHAIN_PREVIEW_ON) {
            window.localStorage.setItem(MULTICHAIN_PREVIEW_STORAGE_KEY, '1');
            return true;
        }

        if (param === MULTICHAIN_PREVIEW_OFF) {
            window.localStorage.removeItem(MULTICHAIN_PREVIEW_STORAGE_KEY);
            return false;
        }

        return window.localStorage.getItem(MULTICHAIN_PREVIEW_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
};

/**
 * Chains every newly-created `AccountMultichain` ships with. SOL is
 * intentionally excluded — chain-kit has no Solana module today, so a
 * SOL wallet would derive nothing usable. Add SOL here once chain-kit
 * lands its Solana adapter (see `chains/types.ts` notes on
 * `deriveKeys`).
 *
 * Used by the create-standard and BIP39-import flows in `uikit` when
 * `MULTICHAIN_ENABLED` is on; service-level code (e.g.
 * `multichainCreateService`) takes the chain set as an argument and
 * doesn't depend on this constant directly.
 */
export const DEFAULT_MULTICHAIN_CHAINS: ChainId[] = ['ton', 'evm', 'btc', 'tron'];
