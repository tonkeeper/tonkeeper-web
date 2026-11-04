import { Account } from '../../entries/account';
import { ChainId } from '../../chains';
import { ChainSigner, SignerFactory, SignerFactoryArgs } from './types';

/**
 * Registry of `(account.type, chain)` → `SignerFactory` strategies.
 *
 * Strategies are registered at module load time by their containing
 * files importing this module and calling `register(...)`. The
 * aggregator at `./factory.ts` imports the strategy modules for their
 * side effects, then exposes `resolve(...)`.
 *
 * Only the TON column is populated; non-TON chains throw a clean
 * runtime error instead of returning an opaque undefined.
 */

type AccountType = Account['type'];
type RegistryKey = `${AccountType}:${ChainId}`;

const registry = new Map<RegistryKey, SignerFactory>();

const keyOf = (accountType: AccountType, chain: ChainId): RegistryKey =>
    `${accountType}:${chain}` as RegistryKey;

export const register = (
    accountType: AccountType,
    chain: ChainId,
    factory: SignerFactory
): void => {
    const key = keyOf(accountType, chain);
    if (registry.has(key)) {
        throw new Error(`Signer strategy already registered for ${key}`);
    }
    registry.set(key, factory);
};

export const resolve = async (
    args: SignerFactoryArgs & { accountType: AccountType }
): Promise<ChainSigner> => {
    const { accountType, chain } = args;
    const factory = registry.get(keyOf(accountType, chain));
    if (!factory) {
        throw new Error(
            `Signer strategy not registered for account type "${accountType}" on chain "${chain}". ` +
                'Only TON strategies are wired today.'
        );
    }
    return factory(args);
};

/** Test-only: reset registrations so tests can register fresh strategies. */
export const _resetRegistryForTests = (): void => {
    registry.clear();
};
