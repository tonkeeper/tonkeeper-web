/**
 * V5R1 Library Cell in Message Body Test (3.3)
 * https://tonviewer.com/transaction/743d84f69adba2e65532d233a4ba93881bb6ffc1ea3fa476474fb4b49df32ec3
 *
 * Wallet: UQAB5xH0wnHdKB2WLppQv7V8GN60PrDZPCbkHctyq4crXbYy
 * Destination: UQCae11h9N5znylEPRjmuLYGvIwnxkcCw4zVW4BJjVASi5eL
 * Value: 0.01 TON
 * Body: Contains library reference cell (264 bits, exotic)
 * seqno: 4
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 *
 * Purpose: Test 3.3 - Validate that fee estimator correctly handles
 * library reference cells (exotic cells) in message body.
 * Library cell should be counted as 264 bits (8-bit type + 256-bit hash),
 * NOT dereferenced to its full content.
 *
 * Library used: USDT Jetton Wallet Code
 * Hash: 8f452d7a4dfd74066b682365177259ed05734435be76b5fd4bd5d8af2b7c3d68
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

export const V5R1_LIBRARY_BODY: WalletFeeTestCase = {
    txHash: '743d84f69adba2e65532d233a4ba93881bb6ffc1ea3fa476474fb4b49df32ec3',

    input: {
        inMsgBoc:
            'te6cckEBBQEA3gAB5YgAA84j6YTjulA7LF00oX9q+DG9aH1hsnhNyDuW5VcOVroDm0s7c///+ItKFOcIAAAAJc98QMupXJWIfxDzyTVwthc5JpV/rwl0fMK9iENFr6Lk2KCeFQ4Ioplf5MoYJBn7/Zpbm1jgrauI3y6cNNdErAMBAgoOw8htAwIDAAABbmIATT2usPpvOc+Uoh6Mc1xbA15GE+MjgWHGaq3AJMaoCUWcxLQAAAAAAAAAAAAAAAAAAAAAAAAECEICj0Utek39dAZraCNlF3JZ7QVzRDW+drX9S9XYryt8PWhIvBQ+',
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 5012n, cells: 22n },
        timeDelta: 2792n // utime=1765973099, last_paid=1765970307
    },

    expected: {
        gasUsed: 4939n, // 4222 + 717*1
        gasFee: 1_975_600n,
        actionFee: 181_863n, // includes 264 bits from library cell
        storageFee: 683n,
        importFee: 857_600n,
        fwdFeeRemaining: 363_737n,
        walletFee: 3_379_483n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
