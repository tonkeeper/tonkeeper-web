/**
 * V3R2 Multi-message TON Transfer (3 messages)
 * https://tonviewer.com/transaction/9758ce7b17d25f6f520d5c8be139de10abecd187fe16484263a0e5ae7fa1a298
 *
 * Wallet: EQBFk5RG37Dt-23Egx2RfJ2IHU_Kg99Wh0geO8Kf2V-VrSXr
 * Destinations: 3 different addresses
 * Value: 0.01 TON each
 * seqno: 2
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 *
 * Purpose: Validate gas formula gasUsed = baseGas + gasPerMsg * outMsgsCount
 * Expected: gasUsed = 2352 + 642*3 = 4278
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

export const V3R2_MULTI_TRANSFER: WalletFeeTestCase = {
    txHash: '9758ce7b17d25f6f520d5c8be139de10abecd187fe16484263a0e5ae7fa1a298',

    input: {
        inMsgBoc:
            'te6cckECBAEAAVUAA+OIAIsnKI2/Ydv224kGOyL5OxA6n5UHvq0OkDx3hT+yvytaB34zOGFqj3w0evXwQI/ANdZwbVqjHPreRk+zMd9RNGEWZydn2T1g68qTAxs5RMAAdzQn5p/x+A5v57KYgvgzkFFNTRi7ShOIgAAAABAYGBwBAgMAkGIAFOFGEqPS/PDa9FlHVFZQWYRs3sUuXlIAuXN6eE1iGy0cxLQAAAAAAAAAAAAAAAAAAAAAAABWM1IyIG11bHRpIHRlc3QgMQCQYgB4tRiYij2hXdgYiXa+8xTlV+MyEerBkhZwvQFX3bSTPZzEtAAAAAAAAAAAAAAAAAAAAAAAAFYzUjIgbXVsdGkgdGVzdCAyAJBiAHZvQ5onmVjHlys7khXWibBVj8TTEgE6DMssxFzEr+h1nMS0AAAAAAAAAAAAAAAAAAAAAAAAVjNSMiBtdWx0aSB0ZXN0IDPXKVZl',
        walletVersion: TonWalletVersion.V3R2,
        storageUsed: { bits: 1315n, cells: 3n },
        timeDelta: 1101n // 1765960460 (utime) - 1765959359 (last_paid)
    },

    expected: {
        gasUsed: 4278n, // 2352 + 642*3
        gasFee: 1_711_200n,
        actionFee: 399_993n,
        storageFee: 48n,
        importFee: 1_211_200n,
        fwdFeeRemaining: 800_007n,
        walletFee: 4_122_448n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
