import { register } from './registry';
import { tonWalletContractStrategy } from './ton-strategy';

export { getStrategy } from './registry';
export type { WalletContractStrategy } from './types';
export type { TonWalletContract, TonWalletContractArgs } from './ton-strategy';

let registered = false;

/**
 * Register every wallet contract strategy. Idempotent — safe to call
 * from multiple entry points without exploding on duplicate
 * registration.
 */
export const registerWalletContractStrategies = (): void => {
    if (registered) return;
    register('ton', tonWalletContractStrategy);
    registered = true;
};

registerWalletContractStrategies();
