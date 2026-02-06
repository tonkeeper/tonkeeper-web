import { Cell } from '@ton/core';
import { beforeAll, describe, expect, it } from 'vitest';

import { BLOCKCHAIN_CONFIG_2024_12 } from './fixtures/blockchain-config';
import { fetchExpectedFees, shouldFetchRealFees, ExpectedFees } from './fixtures/tonapi-fetcher';
import { FEE_TEST_CASES, EXT } from './fixtures/test-cases';
import { WalletFeeTestCase, parseWalletOutMsgCells } from './fixtures/utils';
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
    for (const fixture of FEE_TEST_CASES) {
        createFeeTests(fixture.name, fixture);
    }
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
    describe('computeAddExtensionGasFromExtensions', () => {
        // TX: 3eb607af0ee02aa773c9e840c817e62e2addc0871a6d6bdcd30e95784840a95e
        it('0→1: empty dict → 6110', () => {
            expect(computeAddExtensionGasFromExtensions([], EXT.E1)).toBe(6110n);
        });

        // TX: 185a5fd6fe0a996786b7acd4b2a5ff3b69df8475be91118d4ba726d90c4bc8f3
        it('1→2: 1 ext → 7210', () => {
            expect(computeAddExtensionGasFromExtensions([EXT.E1], EXT.E2)).toBe(7210n);
        });

        // TX: d505f6df24065a837fe0e3916b4dffdadf4de45f20b784a6862c58b7609c9828
        it('2→3: 2 ext → 7810', () => {
            expect(computeAddExtensionGasFromExtensions([EXT.E1, EXT.E2], EXT.E3)).toBe(7810n);
        });

        // TX: e89c1640cd32335a123caa6737ac3767447f8818ff911bad03a3ba3555361565
        it('3→4: 3 ext → 8410', () => {
            expect(computeAddExtensionGasFromExtensions([EXT.E1, EXT.E2, EXT.E3], EXT.E4)).toBe(
                8410n
            );
        });

        // TX: bdfdae4d4ddd87f0e45ee2249701e01538ec4d28a711e44b7debd2ba0c680f7b
        it('4→5: 4 ext → 7810', () => {
            expect(
                computeAddExtensionGasFromExtensions([EXT.E1, EXT.E2, EXT.E3, EXT.E4], EXT.E5)
            ).toBe(7810n);
        });

        // TX: ca13fd5b2d0321128b265a7b4e1155ca142a08f8cc01523370385b05ab978e69
        it('5→6: 5 ext → 8410', () => {
            expect(
                computeAddExtensionGasFromExtensions(
                    [EXT.E1, EXT.E2, EXT.E3, EXT.E4, EXT.E5],
                    EXT.E6
                )
            ).toBe(8410n);
        });

        // TX: 2e63cf4af8192d34f963656c632715ab66689a862d6f78e703360d3352adf07d
        it('6→7: 6 ext → 9010', () => {
            expect(
                computeAddExtensionGasFromExtensions(
                    [EXT.E1, EXT.E2, EXT.E3, EXT.E4, EXT.E5, EXT.E6],
                    EXT.E7
                )
            ).toBe(9010n);
        });

        // TX: a24db9110975efc27875b5786240384e96e58b29bf5497fefc84b8914f20a8a0
        it('7→8: 7 ext → 7810', () => {
            expect(
                computeAddExtensionGasFromExtensions(
                    [EXT.E1, EXT.E2, EXT.E3, EXT.E4, EXT.E5, EXT.E6, EXT.E7],
                    EXT.E8
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
            expect(computeRemoveExtensionGasFromExtensions([EXT.E1], EXT.E1)).toBe(5865n);
        });

        it('2→1: root collapse (+75) → 6565', () => {
            expect(computeRemoveExtensionGasFromExtensions([EXT.E1, EXT.E2], EXT.E2)).toBe(6565n);
        });
    });
});
