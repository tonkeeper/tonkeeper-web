/**
 * V5R1 Remove Prelast Extension (2→1)
 * https://tonviewer.com/transaction/4862b0d85ded1db98571493e2d0af72cec7fd5e86fcb4b29c2cbe8ee690caf47
 *
 * Wallet: UQBNUQQgFaC_XgIvEY-OcH_M5bMzrmlgFEBwHyI1fxVW-_d4
 * Extension to remove: 0:0000000000000000000000000000000000000000000000000000000000000001
 * seqno: 3
 * utime: 1766048641
 *
 * Purpose: Test remove extension gas when root fork collapses (2→1).
 *
 * REMOVE gas formula (from TVM dict_delete analysis):
 *   gas = 5290 + 600×cellLoads + (needsMerge ? 75 : 0)
 *
 * Where needsMerge = siblingIsFork OR rootCollapse (2→1)
 * The +75 = 3 × cell_reload (3 × 25) for edge merge operations.
 *
 * With 2 extensions (ROOT FORK → 2 LEAFs):
 * - cellLoads = 2 (root fork + target leaf)
 * - siblingIsFork = false (sibling is LEAF)
 * - rootCollapse = true (2→1 promotes remaining leaf to root)
 * - gas = 5290 + 1200 + 75 = 6565 ✓
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

// Existing 2 extensions (before removal)
const EXISTING_EXTENSIONS = [
    'e8af660480cb56a355e06cfcd22cf474252d721ecbcb32bd98fcc8522b6ebbca', // #1 (first added)
    '0000000000000000000000000000000000000000000000000000000000000001' // #2 - to be removed
];

export const V5R1_REMOVE_EXT_PRELAST: WalletFeeTestCase = {
    txHash: '4862b0d85ded1db98571493e2d0af72cec7fd5e86fcb4b29c2cbe8ee690caf47',

    input: {
        inMsgBoc:
            'te6cckEBAgEAmwABRYgAmqIIQCtBfrwEXiMfHOD/mctmZ1zSwCiA4D5Eav4qrfYMAQDlc2lnbn///xFpQ8mYAAAAA0DgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM+ox14QmGm2ktksbaghTgG/OlpdAlQgbv1KoNQhwELXWy9RHsOIlCLmoVzoqKn7ElDbj0CMk4b2t9mGH0uqvgNDTc/mk=',
        existingExtensions: EXISTING_EXTENSIONS,
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 5546n, cells: 25n },
        timeDelta: 14042n // utime(1766048641) - last_paid(1766034599)
    },

    expected: {
        // Formula: gas = 5290 + 600×cellLoads + (siblingIsFork || rootCollapse ? 75 : 0)
        // cellLoads = 2 (root fork + target leaf)
        // siblingIsFork = false, rootCollapse = true (2→1)
        // +75 gas for edge merge (3 × cell_reload = 3 × 25)
        // gas = 5290 + 1200 + 75 = 6565
        gasUsed: 6565n,
        gasFee: 2_626_000n, // 6565 × 400
        actionFee: 0n,
        storageFee: 3867n, // (5546×1 + 25×500) × 14042 / 65536
        importFee: 806_800n,
        fwdFeeRemaining: 0n,
        walletFee: 3_436_667n // 2_626_000 + 3867 + 806_800
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
