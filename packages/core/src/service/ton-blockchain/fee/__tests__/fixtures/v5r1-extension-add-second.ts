/**
 * V5R1 Add Second Extension
 * https://tonviewer.com/transaction/30575e1ea9c73215b623c560562bf26fbd9ca5e32a4b35e3449b5763bba05c11
 *
 * Wallet: EQBNUQQgFaC_XgIvEY-OcH_M5bMzrmlgFEBwHyI1fxVW-6q9
 * Extension: EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAd99
 * seqno: 2
 * utime: 1766034599
 *
 * Purpose: Test 5.2 - Validate fee estimation for adding extension
 * when there is already 1 existing extension.
 *
 * With 1 existing extension, trie is ROOT → LEAF.
 * Adding second extension requires loading root (1 cellLoad),
 * then creating fork at point of key divergence.
 *
 * Gas calculation (cellLoads=1):
 * gasUsed = 6610 + 600 × 1 = 7210
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

// Existing extension (from first test)
// Address: EQDor2YEgMtWo1XgbPzSLPR0JS1yHsvLMr2Y_MhSK267ygG2
const EXISTING_EXTENSION_HASH = 'e8af660480cb56a355e06cfcd22cf474252d721ecbcb32bd98fcc8522b6ebbca';

export const V5R1_EXTENSION_ADD_SECOND: WalletFeeTestCase = {
    txHash: '30575e1ea9c73215b623c560562bf26fbd9ca5e32a4b35e3449b5763bba05c11',

    input: {
        inMsgBoc:
            'te6cckEBAgEAmwABRYgAmqIIQCtBfrwEXiMfHOD/mctmZ1zSwCiA4D5Eav4qrfYMAQDlc2lnbn///xFpQ5nrAAAAAkCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOMgSji7NZxA4UOBTvhF0xkwL27g64NPxmjxPQtAnno9A3oGEnAO11p+ilnMrEajHbiV65pR/ZZoWlLzqcrtAILHFWRfg=',
        existingExtensions: [EXISTING_EXTENSION_HASH], // 1 existing extension
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 5280n, cells: 23n },
        timeDelta: 1607n // utime(1766034599) - last_paid(1766032992)
    },

    expected: {
        gasUsed: 7210n, // cellLoads=1: 6610 + 600 × 1 = 7210
        gasFee: 2_884_000n,
        actionFee: 0n, // ZERO because no outMsgs
        storageFee: 412n,
        importFee: 806_800n,
        fwdFeeRemaining: 0n,
        walletFee: 3_691_212n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
