/**
 * V5R1 Simple TON Transfer
 * https://tonviewer.com/transaction/8612717faece81bf6a2c7b44c9b4609b71e06ae7d0c1aa356e6cd8f30c801056
 *
 * Wallet: EQDor2YEgMtWo1XgbPzSLPR0JS1yHsvLMr2Y_MhSK267ygG2
 * Destination: UQApwowlR6X54bXoso6orKCzCNm9ily8pAFy5vTwmsQ2WvVi
 * Value: 0.01 TON
 * seqno: 1 (NOT deploy - no StateInit)
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

export const V5R1_SIMPLE_TRANSFER: WalletFeeTestCase = {
    txHash: '8612717faece81bf6a2c7b44c9b4609b71e06ae7d0c1aa356e6cd8f30c801056',

    input: {
        inMsgBoc:
            'te6cckEBBAEAygAB5YgB0V7MCQGWrUarwNn5pFno6Epa5D2XlmV7MfmQpFbdd5QDm0s7c///+ItKEsWAAAAADVL1hvMF+kXoAPfh8o5Si/90ln+7aUZX1+q49NXnnIx02PxrF0pgHtgV5DmXSIUI8apByap2eB+AIbWIi4vuGBEBAgoOw8htAwIDAAAAjmIAFOFGEqPS/PDa9FlHVFZQWYRs3sUuXlIAuXN6eE1iGy0cxLQAAAAAAAAAAAAAAAAAAAAAAABWNVIxIHNpbXBsZSB0ZXN0WOFYaQ==',
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 5012n, cells: 22n },
        timeDelta: 54358n // 1765955461 (utime) - 1765901103 (last_paid)
    },

    expected: {
        gasUsed: 4939n,
        gasFee: 1_975_600n,
        actionFee: 133_331n,
        storageFee: 13_281n,
        importFee: 763_200n,
        fwdFeeRemaining: 266_669n,
        walletFee: 3_152_081n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
