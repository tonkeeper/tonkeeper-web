/**
 * V5R1 Within-message Deduplication Test (3.1)
 * https://tonviewer.com/transaction/440d91a1e727fa59efbe420dc747b265a284ae4bb2d7d8b0e4919ea16e2b0965
 *
 * Wallet: UQAB5xH0wnHdKB2WLppQv7V8GN60PrDZPCbkHctyq4crXbYy
 * Destination: UQCae11h9N5znylEPRjmuLYGvIwnxkcCw4zVW4BJjVASi5eL
 * Value: 0.01 TON
 * Body: Custom cell with 2 refs to the SAME cell
 * seqno: 2
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 *
 * Purpose: Test 3.1 - Validate cell deduplication WITHIN a single message.
 * The message body has 2 references to the same cell (same hash).
 * countUniqueCellStats should count it as 2 cells (body + 1 shared), not 3.
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

export const V5R1_DEDUP_WITHIN_MSG: WalletFeeTestCase = {
    txHash: '0339b0c0720456038ecfcaedc19f287341cd2df5ee0891321540070da554d054',

    input: {
        inMsgBoc:
            'te6cckEBBQEA3AAB5YgAA84j6YTjulA7LF00oX9q+DG9aH1hsnhNyDuW5VcOVroDm0s7c///+ItKFGrAAAAAFbwDwxgL1Ime6rKH1Otm8lnAWH3J8aUH6Jw3sySXW+Lc/ZpaJ1qchT/sGJMcuaW5TIlZ1QK04gXiCtkHKo31Ih0BAgoOw8htAwIDAAACbmIATT2usPpvOc+Uoh6Mc1xbA15GE+MjgWHGaq3AJMaoCUWcxLQAAAAAAAAAAAAAAAAAAAAAAAAEBAA8EjRWeHNoYXJlZCBkYXRhIGZvciBkZWR1cCB0ZXN0je6JOA==',
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 5012n, cells: 22n },
        timeDelta: 2797n // 1765969182 (actual) - 1765966385 (last_paid)
    },

    expected: {
        gasUsed: 4939n, // 4222 + 717*1
        gasFee: 1_975_600n,
        actionFee: 178_663n, // Body with 2 refs to same cell (deduplicated)
        storageFee: 684n,
        importFee: 848_000n,
        fwdFeeRemaining: 357_337n,
        walletFee: 3_360_284n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
