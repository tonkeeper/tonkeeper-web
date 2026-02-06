/**
 * V5R1 Multi-message TON Transfer (3 messages)
 * https://tonviewer.com/transaction/9043311ef14e365b6a856a48d8126527363ef565c7aaa310948dcbfc691c526a
 *
 * Wallet: EQDor2YEgMtWo1XgbPzSLPR0JS1yHsvLMr2Y_MhSK267ygG2
 * Destinations: 3 different addresses
 * Value: 0.01 TON each
 * seqno: 2
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 *
 * Purpose: Validate gas formula gasUsed = baseGas + gasPerMsg * outMsgsCount
 * Expected: gasUsed = 4222 + 717*3 = 6373
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

export const V5R1_MULTI_TRANSFER: WalletFeeTestCase = {
    txHash: '9043311ef14e365b6a856a48d8126527363ef565c7aaa310948dcbfc691c526a',

    input: {
        inMsgBoc:
            'te6cckECCAEAAXEAAeWIAdFezAkBlq1Gq8DZ+aRZ6OhKWuQ9l5ZlezH5kKRW3XeUA5tLO3P///iLShO3YAAAABUZ50fwccMDqEOvwu6DVhQAQOt4PsclSdfdktQsk5nDCob7nMpPMfCMCQeCBX297wU0F9hpGIJYOAsjb/Nx8RoTAQIKDsPIbQMCBwIKDsPIbQMDBgIKDsPIbQMEBQAAAJBiABThRhKj0vzw2vRZR1RWUFmEbN7FLl5SALlzenhNYhstHMS0AAAAAAAAAAAAAAAAAAAAAAAAVjVSMSBtdWx0aSB0ZXN0IDEAkGIAeLUYmIo9oV3YGIl2vvMU5VfjMhHqwZIWcL0BV920kz2cxLQAAAAAAAAAAAAAAAAAAAAAAABWNVIxIG11bHRpIHRlc3QgMgCQYgAiycojb9h2/bbiQY7Ivk7EDqflQe+rQ6QPHeFP7K/K1pzEtAAAAAAAAAAAAAAAAAAAAAAAAFY1UjEgbXVsdGkgdGVzdCAzCkLbdA==',
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 5012n, cells: 22n },
        timeDelta: 6338n // 1765961799 (utime) - 1765955461 (last_paid)
    },

    expected: {
        gasUsed: 6373n, // 4222 + 717*3
        gasFee: 2_549_200n,
        actionFee: 399_993n,
        storageFee: 1_549n,
        importFee: 1_419_200n,
        fwdFeeRemaining: 800_007n,
        walletFee: 5_169_949n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
