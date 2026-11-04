import { ChainId } from '../../../chains/types';
import { WalletContractStrategy } from './types';

/**
 * Registry of `chain` → `WalletContractStrategy` mirroring the sign
 * registry (`service/sign/registry.ts`). Only TON is registered today;
 * non-TON chains throw a clear runtime error.
 *
 * Strategies are registered at module load time by the aggregator at
 * `./index.ts`, which imports the concrete strategy modules for their
 * side effects.
 */

const registry = new Map<ChainId, WalletContractStrategy>();

export const register = <TArgs, TContract>(
    chain: ChainId,
    strategy: WalletContractStrategy<TArgs, TContract>
): void => {
    if (registry.has(chain)) {
        throw new Error(`Wallet contract strategy already registered for chain "${chain}"`);
    }
    registry.set(chain, strategy as WalletContractStrategy);
};

export const getStrategy = <TArgs = unknown, TContract = unknown>(
    chain: ChainId
): WalletContractStrategy<TArgs, TContract> => {
    const strategy = registry.get(chain);
    if (!strategy) {
        throw new Error(
            `Wallet contract strategy not registered for chain "${chain}". ` +
                'Only TON is wired today.'
        );
    }
    return strategy as WalletContractStrategy<TArgs, TContract>;
};

/** Test-only: reset registrations so tests can register fresh strategies. */
export const _resetRegistryForTests = (): void => {
    registry.clear();
};
