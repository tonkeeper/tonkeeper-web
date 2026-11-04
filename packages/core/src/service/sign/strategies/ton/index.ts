import { register } from '../../registry';
import { keystoneTonSigner } from './keystone-ton-signer';
import { ledgerTonSigner } from './ledger-ton-signer';
import { mamTonSigner } from './mam-ton-signer';
import { mnemonicTonSigner, testnetTonSigner } from './mnemonic-ton-signer';
import { multichainTonSigner } from './multichain-ton-signer';
import { multisigTonSigner } from './multisig-signer';
import { skTonSigner } from './sk-ton-signer';
import { tonOnlyTonSigner } from './ton-only-signer';
import { watchOnlyTonSigner } from './watch-only-signer';

/**
 * Importing this module registers every TON signing strategy. The
 * factory entry point (`../../factory.ts`) does so once at load time
 * so callers don't need to think about registration order.
 */
let registered = false;
export const registerTonStrategies = (): void => {
    if (registered) return;
    registered = true;

    register('ton-only', 'ton', tonOnlyTonSigner);
    register('ledger', 'ton', ledgerTonSigner);
    register('keystone', 'ton', keystoneTonSigner);
    register('mam', 'ton', mamTonSigner);
    register('mnemonic', 'ton', mnemonicTonSigner);
    register('testnet', 'ton', testnetTonSigner);
    register('sk', 'ton', skTonSigner);
    register('watch-only', 'ton', watchOnlyTonSigner);
    register('ton-multisig', 'ton', multisigTonSigner);
    register('multichain', 'ton', multichainTonSigner);
};
