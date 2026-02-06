import { Cell } from '@ton/core';
import { beforeAll, describe, expect, it } from 'vitest';

import { BLOCKCHAIN_CONFIG_2024_12 } from './fixtures/blockchain-config';
import { fetchExpectedFees, shouldFetchRealFees, ExpectedFees } from './fixtures/tonapi-fetcher';
import { WalletFeeTestCase, parseWalletOutMsgCells } from './fixtures/utils';
import { V3R1_DEPLOY_TRANSFER } from './fixtures/v3r1-deploy-transfer';
import { V3R1_MULTI_TRANSFER } from './fixtures/v3r1-multi-transfer';
import { V3R1_SIMPLE_TRANSFER } from './fixtures/v3r1-simple-transfer';
import { V3R2_DEPLOY_TRANSFER } from './fixtures/v3r2-deploy-transfer';
import { V3R2_MULTI_TRANSFER } from './fixtures/v3r2-multi-transfer';
import { V3R2_SIMPLE_TRANSFER } from './fixtures/v3r2-simple-transfer';
import { V4R2_DEPLOY_TRANSFER } from './fixtures/v4r2-deploy-transfer';
import { V4R2_MULTI_TRANSFER } from './fixtures/v4r2-multi-transfer';
import { V4R2_SIMPLE_TRANSFER } from './fixtures/v4r2-simple-transfer';
import { V5R1_DEDUP_CROSS_MSG } from './fixtures/v5r1-dedup-cross-msg';
import { V5R1_DEDUP_WITHIN_MSG } from './fixtures/v5r1-dedup-within-msg';
import { V5R1_DEPLOY_TRANSFER } from './fixtures/v5r1-deploy-transfer';
import { V5R1_EXTENSION_ADD_EIGHTH } from './fixtures/v5r1-extension-add-eighth';
import { V5R1_EXTENSION_ADD_FIRST } from './fixtures/v5r1-extension-add-first';
import { V5R1_EXTENSION_ADD_NINTH } from './fixtures/v5r1-extension-add-ninth';
import { V5R1_EXTENSION_ADD_SECOND } from './fixtures/v5r1-extension-add-second';
import { V5R1_JETTON_DEPLOY_TRANSFER } from './fixtures/v5r1-jetton-deploy-transfer';
import { V5R1_JETTON_SIMPLE_TRANSFER } from './fixtures/v5r1-jetton-simple-transfer';
import { V5R1_LIBRARY_BODY } from './fixtures/v5r1-library-body';
import { V5R1_MULTI_TRANSFER } from './fixtures/v5r1-multi-transfer';
import { V5R1_REMOVE_EXT_FORK_SIBLING } from './fixtures/v5r1-remove-ext-fork-sibling';
import { V5R1_REMOVE_EXT_LAST } from './fixtures/v5r1-remove-ext-last';
import { V5R1_REMOVE_EXT_LEAF_SIBLING } from './fixtures/v5r1-remove-ext-leaf-sibling';
import { V5R1_REMOVE_EXT_PRELAST } from './fixtures/v5r1-remove-ext-prelast';
import { V5R1_SEND_ALL_TRANSFER } from './fixtures/v5r1-send-all-transfer';
import { V5R1_SIMPLE_TRANSFER } from './fixtures/v5r1-simple-transfer';
import {
    computeActionFee,
    computeAddExtensionGas,
    computeAddExtensionGasFromExtensions,
    computeAddFirstExtensionGas,
    computeForwardFee,
    computeGasFee,
    computeImportFee,
    computeRemoveExtensionGas,
    computeRemoveExtensionGasFromExtensions,
    computeRemoveLastExtensionGas,
    computeStorageFee,
    computeWalletGasUsed,
    estimateWalletFee,
    EstimateWalletFeeParams,
    extractFeeConfig,
    parseV5R1ExtensionAction,
    sumRefsStats
} from '../fees';
import { TonWalletVersion } from '../compat';

/**
 * TON Fee Calculation Specification
 *
 * This file serves as executable documentation for TON fee estimation.
 * Each section documents a specific formula with unit tests.
 *
 * Modes:
 *   pnpm -F @tonkeeper/core test run fees.spec.ts                    # compare with fixtures
 *   FETCH_REAL_FEES=1 pnpm -F @tonkeeper/core test run fees.spec.ts  # fetch from blockchain
 */

// Get basechain config for unit tests
const unitTestConfig = extractFeeConfig(BLOCKCHAIN_CONFIG_2024_12, 0);

// ============================================================================
// 1. computeGasFee
// ============================================================================

describe('1. computeGasFee (formula: gasUsed × gasPrice >> 16)', () => {
    it('returns 0 for gasUsed = 0', () => {
        expect(computeGasFee(unitTestConfig, 0n)).toBe(0n);
    });

    it('calculates gas fee: gasUsed=4939 → 1975600', () => {
        // V5R1 simple transfer: 4939 gas units
        expect(computeGasFee(unitTestConfig, 4939n)).toBe(1975600n);
    });
});

// ============================================================================
// 2. computeStorageFee
// ============================================================================

describe('2. computeStorageFee', () => {
    /**
     * Formula: ceil((bits × bitPrice + cells × cellPrice) × timeDelta / 2^16)
     * Returns 0 when timeDelta <= 0
     */

    describe('when timeDelta <= 0', () => {
        it('returns 0 for timeDelta = 0', () => {
            expect(computeStorageFee(unitTestConfig, { bits: 100n, cells: 1n }, 0n)).toBe(0n);
        });

        it('returns 0 for negative timeDelta', () => {
            expect(computeStorageFee(unitTestConfig, { bits: 100n, cells: 1n }, -100n)).toBe(0n);
        });
    });

    describe('when timeDelta > 0', () => {
        it('calculates for V5R1 wallet (5012 bits, 22 cells, timeDelta=54358)', () => {
            // used = 5012×1 + 22×500 = 16012
            // ceil(16012 × 54358 / 2^16) = ceil(870340696 / 65536) = 13281
            expect(computeStorageFee(unitTestConfig, { bits: 5012n, cells: 22n }, 54358n)).toBe(
                13281n
            );
        });
    });
});

// ============================================================================
// 3. computeForwardFee
// ============================================================================

describe('3. computeForwardFee', () => {
    /**
     * Formula: lumpPrice + ceil((bitPrice × bits + cellPrice × cells) / 2^16)
     * lumpPrice = 400000, bitPrice = 26214400, cellPrice = 2621440000
     */

    it('returns lumpPrice for bits=0, cells=0', () => {
        expect(computeForwardFee(unitTestConfig, 0n, 0n)).toBe(400000n);
    });

    it('calculates for bits > 0, cells = 0', () => {
        // ceil(26214400 × 667 / 2^16) + 400000 = 266800 + 400000 = 666800
        expect(computeForwardFee(unitTestConfig, 667n, 0n)).toBe(666800n);
    });

    it('calculates for bits = 0, cells > 0', () => {
        // ceil(2621440000 × 1 / 2^16) + 400000 = 40000 + 400000 = 440000
        expect(computeForwardFee(unitTestConfig, 0n, 1n)).toBe(440000n);
    });

    it('calculates for bits > 0, cells > 0', () => {
        // ceil((26214400×667 + 2621440000×1) / 2^16) + 400000 = 306800 + 400000 = 706800
        expect(computeForwardFee(unitTestConfig, 667n, 1n)).toBe(706800n);
    });
});

// ============================================================================
// 4. computeImportFee
// ============================================================================

describe('4. computeImportFee', () => {
    /**
     * Same formula as computeForwardFee (alias).
     * Used for external-in message import fee calculation.
     */

    it('uses same formula as computeForwardFee', () => {
        expect(computeImportFee(unitTestConfig, 667n, 1n)).toBe(
            computeForwardFee(unitTestConfig, 667n, 1n)
        );
    });
});

// ============================================================================
// 5. computeActionFee
// ============================================================================

describe('5. computeActionFee (formula: fwdFee × firstFrac >> 16 ≈ 1/3)', () => {
    it('returns 0 for fwdFee = 0', () => {
        expect(computeActionFee(unitTestConfig, 0n)).toBe(0n);
    });

    it('returns ~1/3 of forward fee', () => {
        // fwdFee × firstFrac >> 16 = 666672 × 21845 >> 16 = 222220
        expect(computeActionFee(unitTestConfig, 666672n)).toBe(222220n);
    });
});

// ============================================================================
// 6. computeWalletGasUsed
// ============================================================================

describe('6. computeWalletGasUsed (formula: baseGas + gasPerMsg × n)', () => {
    /**
     * | Version | baseGas | gasPerMsg |
     * |---------|---------|-----------|
     * | V5R1    | 4222    | 717       |
     * | V4R2    | 2666    | 642       |
     * | V3R2    | 2352    | 642       |
     * | V3R1    | 2275    | 642       |
     */

    describe('V5R1 (baseGas=4222, gasPerMsg=717)', () => {
        it('1 msg: 4222 + 717×1 = 4939', () => {
            expect(computeWalletGasUsed(TonWalletVersion.V5R1, 1n)).toBe(4939n);
        });

        it('3 msgs: 4222 + 717×3 = 6373', () => {
            expect(computeWalletGasUsed(TonWalletVersion.V5R1, 3n)).toBe(6373n);
        });
    });

    describe('V4R2 (baseGas=2666, gasPerMsg=642)', () => {
        it('1 msg: 2666 + 642×1 = 3308', () => {
            expect(computeWalletGasUsed(TonWalletVersion.V4R2, 1n)).toBe(3308n);
        });

        it('3 msgs: 2666 + 642×3 = 4592', () => {
            expect(computeWalletGasUsed(TonWalletVersion.V4R2, 3n)).toBe(4592n);
        });
    });

    describe('V3R2 (baseGas=2352, gasPerMsg=642)', () => {
        it('1 msg: 2352 + 642×1 = 2994', () => {
            expect(computeWalletGasUsed(TonWalletVersion.V3R2, 1n)).toBe(2994n);
        });
    });

    describe('V3R1 (baseGas=2275, gasPerMsg=642)', () => {
        it('1 msg: 2275 + 642×1 = 2917', () => {
            expect(computeWalletGasUsed(TonWalletVersion.V3R1, 1n)).toBe(2917n);
        });
    });
});

// ============================================================================
// Helper functions for integration tests
// ============================================================================

async function loadExpected(fixture: WalletFeeTestCase): Promise<ExpectedFees> {
    if (shouldFetchRealFees()) {
        console.log(`Fetching tx: ${fixture.txHash}`);
        return fetchExpectedFees(fixture.txHash);
    }
    return fixture.expected;
}

function createFeeTests(name: string, fixture: WalletFeeTestCase) {
    describe(name, () => {
        const { input, blockchainConfig } = fixture;
        const storageUsed = input.storageUsed;
        const timeDelta = input.timeDelta;
        // Gas & storage use basechain config (wallet always in workchain 0)
        const config = extractFeeConfig(blockchainConfig, 0);
        // Convert base64 BOC to Cell
        const inMsg = Cell.fromBase64(input.inMsgBoc);
        // Extract outMsgs from inMsg (empty for extensions)
        const outMsgs = parseWalletOutMsgCells(inMsg, input.walletVersion);

        // Extension test data (only set for extension fixtures)
        const existingExtensions = input.existingExtensions;
        const extensionAction = existingExtensions ? parseV5R1ExtensionAction(inMsg) : null;
        const extensionHash = extensionAction?.address.hash.toString('hex') ?? '';
        const isRemoveExtension = extensionAction?.type === 'removeExtension';

        let expected: ExpectedFees;
        beforeAll(async () => {
            expected = await loadExpected(fixture);
        });

        it('computeGasUsed', () => {
            let gasUsed: bigint;
            if (existingExtensions) {
                gasUsed = isRemoveExtension
                    ? computeRemoveExtensionGasFromExtensions(existingExtensions, extensionHash)
                    : computeAddExtensionGasFromExtensions(existingExtensions, extensionHash);
            } else {
                gasUsed = computeWalletGasUsed(input.walletVersion, BigInt(outMsgs.length));
            }
            expect(gasUsed).toBe(expected.gasUsed);
        });

        it('computeGasFee', () => {
            let gasUsed: bigint;
            if (existingExtensions) {
                gasUsed = isRemoveExtension
                    ? computeRemoveExtensionGasFromExtensions(existingExtensions, extensionHash)
                    : computeAddExtensionGasFromExtensions(existingExtensions, extensionHash);
            } else {
                gasUsed = computeWalletGasUsed(input.walletVersion, BigInt(outMsgs.length));
            }
            const gasFee = computeGasFee(config, gasUsed);
            expect(gasFee).toBe(expected.gasFee);
        });

        it('computeActionFee', () => {
            const actionFee = existingExtensions
                ? 0n
                : outMsgs.reduce((acc, msg) => {
                      const { bits, cells } = sumRefsStats(msg);
                      const fwdFee = computeForwardFee(config, bits, cells);
                      return acc + computeActionFee(config, fwdFee);
                  }, 0n);
            expect(actionFee).toBe(expected.actionFee);
        });

        it('computeStorageFee', () => {
            const storageFee = computeStorageFee(config, storageUsed, timeDelta);
            expect(storageFee).toBe(expected.storageFee);
        });

        it('computeImportFee', () => {
            const { bits, cells } = sumRefsStats(inMsg);
            const importFee = computeImportFee(config, bits, cells);
            expect(importFee).toBe(expected.importFee);
        });

        it('estimateWalletFee', () => {
            const params: EstimateWalletFeeParams = existingExtensions
                ? {
                      walletVersion: input.walletVersion as TonWalletVersion.V5R1,
                      storageUsed,
                      inMsg,
                      timeDelta,
                      existingExtensions
                  }
                : {
                      walletVersion: input.walletVersion,
                      storageUsed,
                      inMsg,
                      timeDelta,
                      outMsgs
                  };
            const estimation = estimateWalletFee(blockchainConfig, params);
            expect(estimation.gasFee).toBe(expected.gasFee);
            expect(estimation.actionFee).toBe(expected.actionFee);
            expect(estimation.importFee).toBe(expected.importFee);
            expect(estimation.storageFee).toBe(expected.storageFee);
            expect(estimation.fwdFeeRemaining).toBe(expected.fwdFeeRemaining);
            expect(estimation.walletFee).toBe(expected.walletFee);
        });
    });
}

// ============================================================================
// 8. Blockchain-verified Transactions
// ============================================================================

/**
 * Integration tests with real blockchain transactions.
 * Each fixture contains a real transaction hash and expected fee values.
 */
describe('8. Blockchain-verified Transactions', () => {
    // V3R1 - deploy + transfer (seqno=0, StateInit included)
    createFeeTests('V3R1 - Deploy + Transfer', V3R1_DEPLOY_TRANSFER);

    // V3R1 - simple transfer (seqno>0, no StateInit)
    createFeeTests('V3R1 - Simple TON Transfer', V3R1_SIMPLE_TRANSFER);

    // V3R1 - multi-message transfer (3 messages)
    // Validates gas formula: gasUsed = baseGas + gasPerMsg * outMsgsCount
    createFeeTests('V3R1 - Multi-message Transfer', V3R1_MULTI_TRANSFER);

    // V3R2 - deploy + transfer (seqno=0, StateInit included)
    createFeeTests('V3R2 - Deploy + Transfer', V3R2_DEPLOY_TRANSFER);

    // V3R2 - multi-message transfer (3 messages)
    // Validates gas formula: gasUsed = baseGas + gasPerMsg * outMsgsCount
    createFeeTests('V3R2 - Multi-message Transfer', V3R2_MULTI_TRANSFER);

    // V3R2 - simple transfer (seqno>0, no StateInit)
    createFeeTests('V3R2 - Simple TON Transfer', V3R2_SIMPLE_TRANSFER);

    // V4R2 - deploy + transfer (seqno=0, StateInit included)
    createFeeTests('V4R2 - Deploy + Transfer', V4R2_DEPLOY_TRANSFER);

    // V4R2 - multi-message transfer (3 messages)
    // Validates gas formula: gasUsed = baseGas + gasPerMsg * outMsgsCount
    createFeeTests('V4R2 - Multi-message Transfer', V4R2_MULTI_TRANSFER);

    // V4R2 - verified against real transaction
    // https://tonviewer.com/transaction/319cf6b07dd0207d48c5e4b3afe7f48228fd1fe9ff9d403987ab20c09881ceb1
    createFeeTests('V4R2 - Simple TON Transfer', V4R2_SIMPLE_TRANSFER);

    // V5R1 - deploy + transfer (seqno=0, StateInit included)
    createFeeTests('V5R1 - Deploy + Transfer', V5R1_DEPLOY_TRANSFER);

    // V5R1 - verified against real transaction
    // https://tonviewer.com/transaction/fea78ce4af53ea89cfaacde7359d10a43f23b4a90ce9b451516b8cddb41ba3b7
    createFeeTests('V5R1 - Simple TON Transfer', V5R1_SIMPLE_TRANSFER);

    // V5R1 - send all balance (mode 130)
    // Verifies that sendMode doesn't affect gas calculation
    createFeeTests('V5R1 - Send All Transfer', V5R1_SEND_ALL_TRANSFER);

    // V5R1 - multi-message transfer (3 messages)
    // Validates gas formula: gasUsed = baseGas + gasPerMsg * outMsgsCount
    createFeeTests('V5R1 - Multi-message Transfer', V5R1_MULTI_TRANSFER);

    // V5R1 - deploy + jetton transfer (POSASYVAET)
    createFeeTests('V5R1 - Deploy + Jetton Transfer', V5R1_JETTON_DEPLOY_TRANSFER);

    // V5R1 - simple jetton transfer (USDT)
    createFeeTests('V5R1 - Simple Jetton Transfer', V5R1_JETTON_SIMPLE_TRANSFER);

    // V5R1 - cell deduplication test 3.1 (duplicate refs within single message)
    createFeeTests('V5R1 - Dedup Within Msg', V5R1_DEDUP_WITHIN_MSG);

    // V5R1 - cell deduplication test 3.2 (3 messages with same body)
    createFeeTests('V5R1 - Dedup Cross Msg', V5R1_DEDUP_CROSS_MSG);

    // V5R1 - library cell test 3.3 (exotic cell in message body)
    // CAVEAT: Verifies fee calculation counts 264 bits, but does NOT prove
    // TVM recognizes it as valid library cell (never loaded/dereferenced)
    createFeeTests('V5R1 - Library Cell Body', V5R1_LIBRARY_BODY);

    // V5R1 - extension test 5.1 (add first extension)
    // Key difference: outMsgs=[] → actionFee=0, gasUsed differs (dict operations)
    createFeeTests('V5R1 - Add First Extension', V5R1_EXTENSION_ADD_FIRST);

    // V5R1 - extension test 5.2 (add second extension)
    // Tests Patricia trie insertion: cellLoads=1, gasUsed=7210
    createFeeTests('V5R1 - Add Second Extension', V5R1_EXTENSION_ADD_SECOND);

    // V5R1 - extension test 5.3 (add eighth extension)
    // Tests Patricia trie with new prefix branch: pathDepth=1, subtree>1
    createFeeTests('V5R1 - Add Eighth Extension', V5R1_EXTENSION_ADD_EIGHTH);

    // V5R1 - extension test 5.4 (add ninth extension)
    // Tests deep fork: 00000005 vs 00000004 differ at bit 254
    createFeeTests('V5R1 - Add Ninth Extension', V5R1_EXTENSION_ADD_NINTH);

    // V5R1 - REMOVE extension tests
    // Formula: 5290 + 600×cellLoads + (siblingIsFork || rootCollapse ? 75 : 0)
    createFeeTests('V5R1 - Remove Ext (LEAF sibling)', V5R1_REMOVE_EXT_LEAF_SIBLING);
    createFeeTests('V5R1 - Remove Ext (FORK sibling)', V5R1_REMOVE_EXT_FORK_SIBLING);
    createFeeTests('V5R1 - Remove Ext (2→1)', V5R1_REMOVE_EXT_PRELAST);
    createFeeTests('V5R1 - Remove Ext (1→0)', V5R1_REMOVE_EXT_LAST);
});

// ============================================================================
// 7. V5R1 Extension Gas
// ============================================================================

/**
 * Extension gas calculation tests (blockchain-verified).
 *
 * ADD formula: 6610 + 600 × cellLoads (first: 6110)
 * REMOVE formula: 5290 + 600 × cellLoads + (merge ? 75 : 0)
 *
 * Test data from wallet UQD3KlCnEgNeGs4blSjo03JGyS4Rn1QiWhO7H6hcxaZwpAH6
 * All extension operations verified against real blockchain transactions.
 */
describe('7. V5R1 Extension Gas', () => {
    // Extension hashes in order they were added to the wallet
    const EXT_1 = '613fbe5785a63a981b59e3255f8d94749deadba81d5658d806c6333a1e6a0526';
    const EXT_2 = 'ba6ede4924bdc9ecbd4582c10bfacf1dfdf3e4f1bde5796819e45ff6ea0f8522';
    const EXT_3 = '4758697a8b9cadbecfe0f102132435465768798a9bacbdcedff0011223344556';
    const EXT_4 = '5f708192a3b4c5d6e7f8091a2b3c4d5e6f8091a2b3c4d5e6f708192a3b4c5d6e';
    const EXT_5 = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01';
    const EXT_6 = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff02';
    const EXT_7 = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03';
    const EXT_8 = '0000000000000000000000000000000000000000000000000000000000000004';

    describe('computeAddExtensionGasFromExtensions', () => {
        // TX: 3eb607af0ee02aa773c9e840c817e62e2addc0871a6d6bdcd30e95784840a95e
        it('0→1: empty dict → 6110', () => {
            expect(computeAddExtensionGasFromExtensions([], EXT_1)).toBe(6110n);
        });

        // TX: 185a5fd6fe0a996786b7acd4b2a5ff3b69df8475be91118d4ba726d90c4bc8f3
        it('1→2: 1 ext → 7210', () => {
            expect(computeAddExtensionGasFromExtensions([EXT_1], EXT_2)).toBe(7210n);
        });

        // TX: d505f6df24065a837fe0e3916b4dffdadf4de45f20b784a6862c58b7609c9828
        it('2→3: 2 ext → 7810', () => {
            expect(computeAddExtensionGasFromExtensions([EXT_1, EXT_2], EXT_3)).toBe(7810n);
        });

        // TX: e89c1640cd32335a123caa6737ac3767447f8818ff911bad03a3ba3555361565
        it('3→4: 3 ext → 8410', () => {
            expect(computeAddExtensionGasFromExtensions([EXT_1, EXT_2, EXT_3], EXT_4)).toBe(8410n);
        });

        // TX: bdfdae4d4ddd87f0e45ee2249701e01538ec4d28a711e44b7debd2ba0c680f7b
        it('4→5: 4 ext → 7810', () => {
            expect(computeAddExtensionGasFromExtensions([EXT_1, EXT_2, EXT_3, EXT_4], EXT_5)).toBe(
                7810n
            );
        });

        // TX: ca13fd5b2d0321128b265a7b4e1155ca142a08f8cc01523370385b05ab978e69
        it('5→6: 5 ext → 8410', () => {
            expect(
                computeAddExtensionGasFromExtensions([EXT_1, EXT_2, EXT_3, EXT_4, EXT_5], EXT_6)
            ).toBe(8410n);
        });

        // TX: 2e63cf4af8192d34f963656c632715ab66689a862d6f78e703360d3352adf07d
        it('6→7: 6 ext → 9010', () => {
            expect(
                computeAddExtensionGasFromExtensions(
                    [EXT_1, EXT_2, EXT_3, EXT_4, EXT_5, EXT_6],
                    EXT_7
                )
            ).toBe(9010n);
        });

        // TX: a24db9110975efc27875b5786240384e96e58b29bf5497fefc84b8914f20a8a0
        it('7→8: 7 ext → 7810', () => {
            expect(
                computeAddExtensionGasFromExtensions(
                    [EXT_1, EXT_2, EXT_3, EXT_4, EXT_5, EXT_6, EXT_7],
                    EXT_8
                )
            ).toBe(7810n);
        });
    });

    describe('computeAddFirstExtensionGas', () => {
        it('returns 6110 for empty dict → 1 extension', () => {
            expect(computeAddFirstExtensionGas()).toBe(6110n);
        });
    });

    describe('computeAddExtensionGas (formula: 6610 + 600×cellLoads)', () => {
        it('cellLoads=1 → 7210', () => {
            expect(computeAddExtensionGas(1n)).toBe(7210n);
        });

        it('cellLoads=2 → 7810', () => {
            expect(computeAddExtensionGas(2n)).toBe(7810n);
        });

        it('cellLoads=3 → 8410', () => {
            expect(computeAddExtensionGas(3n)).toBe(8410n);
        });

        it('cellLoads=4 → 9010', () => {
            expect(computeAddExtensionGas(4n)).toBe(9010n);
        });
    });

    // ---- REMOVE Extension ----

    describe('computeRemoveLastExtensionGas', () => {
        it('returns 5865 for 1→0 (5290 + 600 - 25)', () => {
            expect(computeRemoveLastExtensionGas()).toBe(5865n);
        });
    });

    describe('computeRemoveExtensionGas (formula: 5290 + 600×cellLoads ± merge)', () => {
        it('cellLoads=1, no merge → 5890', () => {
            expect(computeRemoveExtensionGas(1n, false)).toBe(5890n);
        });

        it('cellLoads=1, with merge (+75) → 5965', () => {
            expect(computeRemoveExtensionGas(1n, true)).toBe(5965n);
        });

        it('cellLoads=2, no merge → 6490', () => {
            expect(computeRemoveExtensionGas(2n, false)).toBe(6490n);
        });

        it('cellLoads=4, no merge → 7690', () => {
            expect(computeRemoveExtensionGas(4n, false)).toBe(7690n);
        });
    });

    describe('computeRemoveExtensionGasFromExtensions', () => {
        it('1→0: last extension → 5865', () => {
            expect(computeRemoveExtensionGasFromExtensions([EXT_1], EXT_1)).toBe(5865n);
        });

        it('2→1: root collapse (+75) → 6565', () => {
            expect(computeRemoveExtensionGasFromExtensions([EXT_1, EXT_2], EXT_2)).toBe(6565n);
        });
    });
});
