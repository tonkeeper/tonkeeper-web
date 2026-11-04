import { ChainId } from '../../../chains';
import { register } from '../registry';
import { SignerFactory } from '../types';

/**
 * Non-TON signer stubs for `AccountMultichain`. Each registered pair
 * throws on invocation, naming the chain so the consumer sees a clear
 * error instead of the registry's generic fallback.
 *
 * TON is registered separately by `strategies/ton/index.ts` against
 * `multichainTonSigner`.
 */
const NON_TON_CHAINS: ReadonlyArray<Exclude<ChainId, 'ton'>> = ['evm', 'btc', 'tron', 'sol'];

const notWiredStub =
    (chain: ChainId): SignerFactory =>
    async () => {
        throw new Error(`Multichain ${chain} signing is not implemented`);
    };

let registered = false;
export const registerMultichainStubs = (): void => {
    if (registered) return;
    registered = true;
    for (const chain of NON_TON_CHAINS) {
        register('multichain', chain, notWiredStub(chain));
    }
};
