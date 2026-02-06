/**
 * V5R1 Remove Last Extension (1→0)
 * https://tonviewer.com/transaction/9302d3bf88762bac10f62ea02e838eb6bd8f6c5330978143cc7edd24205d56e4
 *
 * Wallet: UQBNUQQgFaC_XgIvEY-OcH_M5bMzrmlgFEBwHyI1fxVW-_d4
 * Extension to remove: 0:e8af660480cb56a355e06cfcd22cf474252d721ecbcb32bd98fcc8522b6ebbca
 * seqno: 4
 * utime: 1766051521
 *
 * Purpose: Test remove extension gas when dict becomes empty (1→0).
 *
 * REMOVE gas formula (from TVM dict_delete + W5 contract analysis):
 *   gas = 5290 + 600×cellLoads - 25 (for 1→0 only)
 *
 * With 1 extension (single LEAF):
 * - cellLoads = 1 (read the single leaf before removing)
 * - Result dict = null → store_dict(null) doesn't need cell_reload for ref
 * - gas = 5290 + 600 - 25 = 5865
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

// Existing 1 extension (before removal)
const EXISTING_EXTENSIONS = [
    'e8af660480cb56a355e06cfcd22cf474252d721ecbcb32bd98fcc8522b6ebbca' // the last one - to be removed
];

export const V5R1_REMOVE_EXT_LAST: WalletFeeTestCase = {
    txHash: '9302d3bf88762bac10f62ea02e838eb6bd8f6c5330978143cc7edd24205d56e4',

    input: {
        inMsgBoc:
            'te6cckEBAgEAmwABRYgAmqIIQCtBfrwEXiMfHOD/mctmZ1zSwCiA4D5Eav4qrfYMAQDlc2lnbn///xFpQ8/uAAAABEDgB0V7MCQGWrUarwNn5pFno6Epa5D2XlmV7MfmQpFbdd5TWBewP4woqHupijNFCZ3KWoGsCJ0hfRU2OiPO5sL27iJwfZBrjOT5CdY3zpWvkiPt9QklKXYWfpvJ1eUtusdARKRdmyQ=',
        existingExtensions: EXISTING_EXTENSIONS,
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 5280n, cells: 23n },
        timeDelta: 2880n // utime(1766051521) - last_paid(1766048641)
    },

    expected: {
        // Formula: gas = 5290 + 600×cellLoads - 25
        // cellLoads = 1 (read single leaf)
        // -25: store_dict(null) doesn't need cell_reload for reference
        // gas = 5290 + 600 - 25 = 5865
        gasUsed: 5865n,
        gasFee: 2_346_000n, // 5865 × 400
        actionFee: 0n,
        storageFee: 738n, // ceil((5280×1 + 23×500) × 2880 / 65536)
        importFee: 806_800n,
        fwdFeeRemaining: 0n,
        walletFee: 3_153_538n // 2_346_000 + 738 + 806_800
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
