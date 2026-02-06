/**
 * V5R1 Cross-message Deduplication Test (3.2)
 * https://tonviewer.com/transaction/3dbbc6f071680ce7d609c4799d6fcea100161b88275a4102a4e37522f88703e3
 *
 * Wallet: UQAB5xH0wnHdKB2WLppQv7V8GN60PrDZPCbkHctyq4crXbYy
 * Destinations: 3 different addresses
 * Value: 0.01 TON each
 * Body: Same comment cell for all messages (deduplicated)
 * seqno: 3
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 *
 * Purpose: Test 3.2 - Validate cell deduplication ACROSS multiple outgoing messages.
 * When multiple messages share the same body cell, it should be counted only once
 * in importFee calculation (inMsg uses shared visited Set).
 *
 * Expected: importFee < v5r1-multi-transfer.importFee (1,419,200) due to deduplication
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

export const V5R1_DEDUP_CROSS_MSG: WalletFeeTestCase = {
    txHash: '139b5f7210fc0a86b54f447d0d060b1d843c1f52bf925057a7011461219a72c4',

    input: {
        inMsgBoc:
            'te6cckECCAEAAVwAAeWIAAPOI+mE47pQOyxdNKF/avgxvWh9YbJ4Tcg7luVXDla6A5tLO3P///iLShSOAAAAABzvOnnqwdRZiru+O8FlP0SOyPOk4d6GXn7lXwnoaPTbtHOFftayjNBC100WUm8nT68UbS91TZ/W/I4vkTl8qVoXAQIKDsPIbQMCBwIKDsPIbQMDBgIKDsPIbQMEBQAAAIJiAE09rrD6bznPlKIejHNcWwNeRhPjI4FhxmqtwCTGqAlFnMS0AAAAAAAAAAAAAAAAAAAAAAAAZGVkdXAgdGVzdACCYgAU4UYSo9L88Nr0WUdUVlBZhGzexS5eUgC5c3p4TWIbLRzEtAAAAAAAAAAAAAAAAAAAAAAAAGRlZHVwIHRlc3QAgmIAdFezAkBlq1Gq8DZ+aRZ6OhKWuQ9l5ZlezH5kKRW3XeUcxLQAAAAAAAAAAAAAAAAAAAAAAABkZWR1cCB0ZXN0/q/S9A==',
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 5012n, cells: 22n },
        timeDelta: 1125n // 1765970307 (actual) - 1765969182 (last_paid)
    },

    expected: {
        gasUsed: 6373n, // 4222 + 717*3
        gasFee: 2_549_200n,
        actionFee: 399_993n, // Each outMsg counted separately (no cross-msg dedup for actionFee)
        storageFee: 275n,
        importFee: 1_352_000n, // vs 1,419,200 in multi-transfer (~5% savings from body dedup)
        fwdFeeRemaining: 800_007n,
        walletFee: 5_101_475n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
