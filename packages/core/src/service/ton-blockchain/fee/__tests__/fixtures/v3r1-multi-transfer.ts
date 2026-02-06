/**
 * V3R1 Multi-message TON Transfer (3 messages)
 * https://tonviewer.com/transaction/a4dc775cbbfc14c46679159a8e9fac6d65439e25fa68dcceb91c0e3de9948943
 *
 * Wallet: EQDxajExFHtCu7AxEu195inKr8ZkI9WDJCzhegKvu2kme2TM
 * Destinations: 3 different addresses
 * Value: 0.01 TON each
 * seqno: 2
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 *
 * Purpose: Validate gas formula gasUsed = baseGas + gasPerMsg * outMsgsCount
 * Expected: gasUsed = 2275 + 642*3 = 4201
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

// === Export ===

export const V3R1_MULTI_TRANSFER: WalletFeeTestCase = {
    txHash: 'a4dc775cbbfc14c46679159a8e9fac6d65439e25fa68dcceb91c0e3de9948943',

    input: {
        inMsgBoc:
            'te6cckECBAEAAVUAA+OIAeLUYmIo9oV3YGIl2vvMU5VfjMhHqwZIWcL0BV920kz2A1v/MHLv+Ml1GqL+s0qf7DWsmXD5MHneAK5FevAbsHo1W8COSizPAKXbac9yyyJPQFvrtyShlcz9YX89cYpGuCFNTRi7ShM/YAAAABAYGBwBAgMAkGIAFOFGEqPS/PDa9FlHVFZQWYRs3sUuXlIAuXN6eE1iGy0cxLQAAAAAAAAAAAAAAAAAAAAAAABWM1IxIG11bHRpIHRlc3QgMQCQYgAiycojb9h2/bbiQY7Ivk7EDqflQe+rQ6QPHeFP7K/K1pzEtAAAAAAAAAAAAAAAAAAAAAAAAFYzUjEgbXVsdGkgdGVzdCAyAJBiAHZvQ5onmVjHlys7khXWibBVj8TTEgE6DMssxFzEr+h1nMS0AAAAAAAAAAAAAAAAAAAAAAAAVjNSMSBtdWx0aSB0ZXN0IDNwpkTh',
        walletVersion: TonWalletVersion.V3R1,
        storageUsed: { bits: 1195n, cells: 3n },
        timeDelta: 7261n // 1765959359 (utime) - 1765952098 (last_paid)
    },

    expected: {
        gasUsed: 4201n, // 2275 + 642*3
        gasFee: 1_680_400n,
        actionFee: 399_993n, // 3 messages
        storageFee: 299n,
        importFee: 1_211_200n,
        fwdFeeRemaining: 800_007n,
        walletFee: 4_091_899n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
