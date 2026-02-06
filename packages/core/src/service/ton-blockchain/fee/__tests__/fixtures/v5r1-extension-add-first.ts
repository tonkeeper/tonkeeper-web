/**
 * V5R1 Add First Extension
 * https://tonviewer.com/transaction/0a1803894b487e63180e914013d3adcc227452c5ad9b646770bad745a8881f2a
 *
 * Wallet: EQBNUQQgFaC_XgIvEY-OcH_M5bMzrmlgFEBwHyI1fxVW-6q9
 * Extension: EQDor2YEgMtWo1XgbPzSLPR0JS1yHsvLMr2Y_MhSK267ygG2
 * seqno: 1
 * utime: 1766032992
 *
 * Purpose: Test 5.1 - Validate fee estimation for extension actions
 * where there are NO outMsgs, only internal wallet dictionary operations.
 *
 * Key difference from transfers:
 * - outMsgs: [] (empty - no outgoing messages)
 * - actionFee: 0 (no forward fees to calculate)
 * - gasUsed: 6110 (first extension: baseGas + overhead + CELL_WRITE)
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

export const V5R1_EXTENSION_ADD_FIRST: WalletFeeTestCase = {
    txHash: '0a1803894b487e63180e914013d3adcc227452c5ad9b646770bad745a8881f2a',

    input: {
        inMsgBoc:
            'te6cckEBAgEAmwABRYgAmqIIQCtBfrwEXiMfHOD/mctmZ1zSwCiA4D5Eav4qrfYMAQDlc2lnbn///xFpQ5RwAAAAAUCgB0V7MCQGWrUarwNn5pFno6Epa5D2XlmV7MfmQpFbdd5QvNbREC1rFe++nNUEYL7i/jFMan6sWaAcQkLcFhMQRdkdHH5FaquHUva9+ECMZuspGMjlVV45P48fwaRk8G6gDO+OSV0=',
        existingExtensions: [], // First extension: empty dict
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 5012n, cells: 22n },
        timeDelta: 1734n // utime(1766032992) - last_paid(1766031258)
    },

    expected: {
        gasUsed: 6110n, // First extension: baseGas(4222) + overhead(1388) + CELL_WRITE(500)
        gasFee: 2_444_000n,
        actionFee: 0n, // ZERO because no outMsgs
        storageFee: 424n,
        importFee: 806_800n,
        fwdFeeRemaining: 0n,
        walletFee: 3_251_224n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
