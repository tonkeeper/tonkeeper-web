/* eslint-disable prettier/prettier */
import { Cell } from '@ton/core';
import { beforeAll, describe, expect, it } from 'vitest';

import { BLOCKCHAIN_CONFIG_2024_12 } from './fixtures/blockchain-config';
import { fetchExpectedFees, shouldFetchRealFees } from './fixtures/tonapi-fetcher';
import { FEE_TEST_CASES, EXT } from './fixtures/test-cases';
import { WalletFeeTestCase, ExpectedFees, parseWalletOutMsgCells } from './fixtures/utils';
import {
    computeActionFee,
    computeAddExtensionGas,
    computeAddExtensionGasFromExtensions,
    computeForwardFee,
    computeGasFee,
    computeImportFee,
    computeRemoveExtensionGas,
    computeRemoveExtensionGasFromExtensions,
    computeRemoveLastExtensionGas,
    computeStorageFee,
    computeWalletGasUsed,
    estimateWalletFee,
    EstimateWalletFeeParams
} from '../fees';
import { TonWalletVersion } from '../compat';

/**
 * TON Fee Calculation Specification
 *
 * This file serves as executable documentation for TON fee estimation.
 * Sections 1-7: unit tests for individual formulas.
 * Section 8: integration tests against real blockchain transactions.
 *
 * Modes:
 *   yarn workspace @tonkeeper/core exec vitest run fees.spec.ts                    # compare with fixtures
 *   FETCH_REAL_FEES=1 yarn workspace @tonkeeper/core exec vitest run fees.spec.ts  # fetch from blockchain
 */

// Basechain config for unit tests
const baseConfig = BLOCKCHAIN_CONFIG_2024_12.basechain;

// ============================================================================
// 1. computeGasFee
// ============================================================================

describe('1. computeGasFee (formula: floor(gasUsed × gasPrice / 2^16))', () => {
    it('returns 0 for gasUsed = 0', () => {
        expect(computeGasFee(baseConfig, 0n)).toBe(0n);
    });

    it('calculates gas fee: gasUsed=4939 → 1_975_600', () => {
        expect(computeGasFee(baseConfig, 4939n)).toBe(1_975_600n);
    });

    describe('floor rounding (gasPrice=1 → result = gasUsed / 2^16, truncated)', () => {
        // Override gasPrice to 1 so gasFee = gasUsed >> 16, isolating rounding behavior
        const roundingConfig = { ...baseConfig, gasPrice: 1n };

        it('rounds 0.0000... down to 0', () => expect(computeGasFee(roundingConfig, 1n)).toBe(0n));
        it('rounds 0.9999... down to 0', () => expect(computeGasFee(roundingConfig, 65535n)).toBe(0n));
        it('keeps exact 1.0           ', () => expect(computeGasFee(roundingConfig, 65536n)).toBe(1n));
        it('rounds 1.0000... down to 1', () => expect(computeGasFee(roundingConfig, 65537n)).toBe(1n));
    });
});

// ============================================================================
// 2. computeStorageFee
// ============================================================================

describe('2. computeStorageFee (formula: ceil((bits×bitPrice + cells×cellPrice) × timeDelta / 2^16))', () => {
    it('returns 0 for timeDelta = 0', () => {
        expect(computeStorageFee(baseConfig, { bits: 100n, cells: 1n }, 0n)).toBe(0n);
    });

    it('returns 0 for negative timeDelta', () => {
        expect(computeStorageFee(baseConfig, { bits: 100n, cells: 1n }, -100n)).toBe(0n);
    });

    it('calculates for V5R1 wallet (5012 bits, 22 cells, timeDelta=54358)', () => {
        // used = 5012×1 + 22×500 = 16012
        // ceil(16012 × 54358 / 2^16) = ceil(870340696 / 65536) = 13281
        expect(computeStorageFee(baseConfig, { bits: 5012n, cells: 22n }, 54358n)).toBe(13281n);
    });

    // bitPrice=1, cellPrice=500 → used = 1×1 + 0×500 = 1, so result = timeDelta / 2^16
    describe('ceil rounding (used=1 → result = timeDelta / 2^16, rounded up)', () => {
        const s = { bits: 1n, cells: 0n };

        it('rounds 0.0000... up to 1', () => expect(computeStorageFee(baseConfig, s, 1n)).toBe(1n));
        it('keeps exact 1.0          ', () => expect(computeStorageFee(baseConfig, s, 65536n)).toBe(1n));
        it('rounds 1.0000... up to 2 ', () => expect(computeStorageFee(baseConfig, s, 65537n)).toBe(2n));
    });
});

// ============================================================================
// 3. computeForwardFee
// ============================================================================

describe('3. computeForwardFee (formula: lumpPrice + ceil((bitPrice×bits + cellPrice×cells) / 2^16))', () => {
    // lumpPrice = 400000, bitPrice = 26214400, cellPrice = 2621440000

    it('returns lumpPrice for bits=0, cells=0', () => {
        expect(computeForwardFee(baseConfig.fwd, 0n, 0n)).toBe(400_000n);
    });

    it('calculates for bits > 0, cells = 0', () => {
        // ceil(26214400 × 667 / 2^16) + 400000 = 266800 + 400000 = 666800
        expect(computeForwardFee(baseConfig.fwd, 667n, 0n)).toBe(666_800n);
    });

    it('calculates for bits = 0, cells > 0', () => {
        // ceil(2621440000 × 1 / 2^16) + 400000 = 40000 + 400000 = 440000
        expect(computeForwardFee(baseConfig.fwd, 0n, 1n)).toBe(440_000n);
    });

    it('calculates for bits > 0, cells > 0', () => {
        // ceil((26214400×667 + 2621440000×1) / 2^16) + 400000 = 306800 + 400000 = 706800
        expect(computeForwardFee(baseConfig.fwd, 667n, 1n)).toBe(706_800n);
    });

    // lumpPrice=0, bitPrice=1, cellPrice=0 → result = ceil(bits / 2^16)
    describe('ceil rounding (bitPrice=1, lump=0, cell=0 → result = bits / 2^16, rounded up)', () => {
        // Override prices so fwdFee = ceil(bits / 2^16), isolating rounding behavior
        const roundingFwd = { ...baseConfig.fwd, bitPrice: 1n, cellPrice: 0n, lumpPrice: 0n };

        it('rounds 0.0000... up to 1', () => expect(computeForwardFee(roundingFwd, 1n, 0n)).toBe(1n));
        it('keeps exact 1.0          ', () => expect(computeForwardFee(roundingFwd, 65536n, 0n)).toBe(1n));
        it('rounds 1.0000... up to 2 ', () => expect(computeForwardFee(roundingFwd, 65537n, 0n)).toBe(2n));
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

    it('calculates import fee: bits=667, cells=1 → 706800', () => {
        expect(computeImportFee(baseConfig.fwd, 667n, 1n)).toBe(706800n);
    });
});

// ============================================================================
// 5. computeActionFee
// ============================================================================

describe('5. computeActionFee (formula: floor(fwdFee × firstFrac / 2^16) ≈ 1/3)', () => {
    // firstFrac = 21845, so multiplier ≈ 21845/65536 ≈ 0.33333

    it('returns 0 for fwdFee = 0', () => {
        expect(computeActionFee(baseConfig.fwd, 0n)).toBe(0n);
    });

    it('returns ~1/3 of forward fee', () => {
        // 666672 × 21845 >> 16 = 222220
        expect(computeActionFee(baseConfig.fwd, 666672n)).toBe(222220n);
    });

    // firstFrac=1 → result = fwdFee / 2^16
    describe('floor rounding (firstFrac=1 → result = fwdFee / 2^16, truncated)', () => {
        // Override firstFrac to 1 so actionFee = fwdFee >> 16, isolating rounding behavior
        const roundingFwd = { ...baseConfig.fwd, firstFrac: 1n };

        it('rounds 0.0000... down to 0', () => expect(computeActionFee(roundingFwd, 1n)).toBe(0n));
        it('rounds 0.9999... down to 0', () => expect(computeActionFee(roundingFwd, 65535n)).toBe(0n));
        it('keeps exact 1.0           ', () => expect(computeActionFee(roundingFwd, 65536n)).toBe(1n));
        it('rounds 1.0000... down to 1', () => expect(computeActionFee(roundingFwd, 65537n)).toBe(1n));
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
    const cases = [
        { version: TonWalletVersion.V5R1, label: 'V5R1', msgs: 1n, gas: 4939n },  // 4222 + 717×1
        { version: TonWalletVersion.V5R1, label: 'V5R1', msgs: 3n, gas: 6373n },  // 4222 + 717×3
        { version: TonWalletVersion.V4R2, label: 'V4R2', msgs: 1n, gas: 3308n },  // 2666 + 642×1
        { version: TonWalletVersion.V4R2, label: 'V4R2', msgs: 3n, gas: 4592n },  // 2666 + 642×3
        { version: TonWalletVersion.V3R2, label: 'V3R2', msgs: 1n, gas: 2994n },  // 2352 + 642×1
        { version: TonWalletVersion.V3R1, label: 'V3R1', msgs: 1n, gas: 2917n }  // 2275 + 642×1
    ];

    for (const c of cases) {
        it(`${c.label}, ${c.msgs} msg → ${c.gas}`, () => {
            expect(computeWalletGasUsed(c.version, c.msgs)).toBe(c.gas);
        });
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
    // ---- ADD Extension ----

    // Full staircase 0→1→...→8 verified against real transactions.
    // Gas is non-monotonic due to Patricia trie rebalancing (e.g. 4→5 < 3→4).
    const addExtFromExtCases = [
        // https://tonviewer.com/transaction/3eb607af0ee02aa773c9e840c817e62e2addc0871a6d6bdcd30e95784840a95e
        { existing: [], add: EXT.E1, gas: 6110n },
        // https://tonviewer.com/transaction/185a5fd6fe0a996786b7acd4b2a5ff3b69df8475be91118d4ba726d90c4bc8f3
        { existing: [EXT.E1], add: EXT.E2, gas: 7210n },
        // https://tonviewer.com/transaction/d505f6df24065a837fe0e3916b4dffdadf4de45f20b784a6862c58b7609c9828
        { existing: [EXT.E1, EXT.E2], add: EXT.E3, gas: 7810n },
        // https://tonviewer.com/transaction/e89c1640cd32335a123caa6737ac3767447f8818ff911bad03a3ba3555361565
        { existing: [EXT.E1, EXT.E2, EXT.E3], add: EXT.E4, gas: 8410n },
        // https://tonviewer.com/transaction/bdfdae4d4ddd87f0e45ee2249701e01538ec4d28a711e44b7debd2ba0c680f7b
        { existing: [EXT.E1, EXT.E2, EXT.E3, EXT.E4], add: EXT.E5, gas: 7810n },
        // https://tonviewer.com/transaction/ca13fd5b2d0321128b265a7b4e1155ca142a08f8cc01523370385b05ab978e69
        { existing: [EXT.E1, EXT.E2, EXT.E3, EXT.E4, EXT.E5], add: EXT.E6, gas: 8410n },
        // https://tonviewer.com/transaction/2e63cf4af8192d34f963656c632715ab66689a862d6f78e703360d3352adf07d
        { existing: [EXT.E1, EXT.E2, EXT.E3, EXT.E4, EXT.E5, EXT.E6], add: EXT.E7, gas: 9010n },
        // https://tonviewer.com/transaction/a24db9110975efc27875b5786240384e96e58b29bf5497fefc84b8914f20a8a0
        { existing: [EXT.E1, EXT.E2, EXT.E3, EXT.E4, EXT.E5, EXT.E6, EXT.E7], add: EXT.E8, gas: 7810n }
    ];

    describe('computeAddExtensionGasFromExtensions', () => {
        for (const c of addExtFromExtCases) {
            it(`${c.existing.length}→${c.existing.length + 1}: gas=${c.gas}`, () => {
                expect(computeAddExtensionGasFromExtensions(c.existing, c.add)).toBe(c.gas);
            });
        }
    });

    // Formula: 6610 + 600 × cellLoads
    const addExtCases = [
        { cellLoads: 1n, gas: 7210n },
        { cellLoads: 2n, gas: 7810n },
        { cellLoads: 3n, gas: 8410n },
        { cellLoads: 4n, gas: 9010n }
    ];

    describe('computeAddExtensionGas (6610 + 600×cellLoads)', () => {
        for (const c of addExtCases) {
            it(`cellLoads=${c.cellLoads} → ${c.gas}`, () => {
                expect(computeAddExtensionGas(c.cellLoads)).toBe(c.gas);
            });
        }
    });

    // ---- REMOVE Extension ----

    describe('computeRemoveLastExtensionGas', () => {
        it('1→0: 5290 + 600 - 25 = 5865', () => {
            expect(computeRemoveLastExtensionGas()).toBe(5865n);
        });
    });

    // Formula: 5290 + 600 × cellLoads + (needsMerge ? 75 : 0)
    const removeExtCases = [
        { cellLoads: 1n, merge: false, gas: 5890n },
        { cellLoads: 1n, merge: true, gas: 5965n },
        { cellLoads: 2n, merge: false, gas: 6490n },
        { cellLoads: 4n, merge: false, gas: 7690n }
    ];

    describe('computeRemoveExtensionGas (5290 + 600×cellLoads ± merge)', () => {
        for (const c of removeExtCases) {
            it(`cellLoads=${c.cellLoads}, merge=${c.merge} → ${c.gas}`, () => {
                expect(computeRemoveExtensionGas(c.cellLoads, c.merge)).toBe(c.gas);
            });
        }
    });

    const removeExtFromExtCases = [
        { existing: [EXT.E1], remove: EXT.E1, gas: 5865n, label: '1→0: last extension' },
        { existing: [EXT.E1, EXT.E2], remove: EXT.E2, gas: 6565n, label: '2→1: root collapse (+75)' }
    ];

    describe('computeRemoveExtensionGasFromExtensions', () => {
        for (const c of removeExtFromExtCases) {
            it(`${c.label} → ${c.gas}`, () => {
                expect(computeRemoveExtensionGasFromExtensions(c.existing, c.remove)).toBe(c.gas);
            });
        }
    });
});


// ============================================================================
// 8. Blockchain-verified Transactions
// ============================================================================

/**
 * Integration tests with real blockchain transactions.
 * Each fixture contains a real transaction hash and expected fee values.
 */
describe('8. Blockchain-verified Transactions', () => {
    async function loadExpected(fixture: WalletFeeTestCase): Promise<ExpectedFees> {
        if (shouldFetchRealFees()) {
            // eslint-disable-next-line no-console
            console.log(`Fetching tx: ${fixture.txHash}`);
            return fetchExpectedFees(fixture.txHash);
        }
        return fixture.expected;
    }

    describe.each(FEE_TEST_CASES)('$name', (fixture) => {
        const { input, blockchainConfig } = fixture;
        const { walletVersion, storageUsed, timeDelta, existingExtensions } = input;
        const inMsg = Cell.fromBase64(input.inMsgBoc);
        const outMsgs = parseWalletOutMsgCells(inMsg, walletVersion);

        let expected: ExpectedFees;
        beforeAll(async () => {
            expected = await loadExpected(fixture);
        });

        it('walletFee', () => {
            const params: EstimateWalletFeeParams = existingExtensions
                ? {
                      walletVersion: walletVersion as TonWalletVersion.V5R1,
                      storageUsed,
                      inMsg,
                      timeDelta,
                      existingExtensions
                  }
                : {
                      walletVersion,
                      storageUsed,
                      inMsg,
                      timeDelta,
                      outMsgs
                  };
            const estimation = estimateWalletFee(blockchainConfig, params);
            expect(estimation.walletFee).toBe(expected.walletFee);
        });
    });
});