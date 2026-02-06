/**
 * V5R1 Simple Jetton Transfer (USDT)
 * https://tonviewer.com/transaction/e1087deb86086b1e8496ab968f99a5530170ed631a534c4d8256329cf454dd70
 *
 * Wallet: UQAB5xH0wnHdKB2WLppQv7V8GN60PrDZPCbkHctyq4crXbYy
 * Jetton: USDT (EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs)
 * Recipient: UQCae11h9N5znylEPRjmuLYGvIwnxkcCw4zVW4BJjVASi5eL
 * Deploy: NO (seqno=1, no StateInit)
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 *
 * Purpose: Validate fee calculation for jetton transfer without wallet deployment
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

export const V5R1_JETTON_SIMPLE_TRANSFER: WalletFeeTestCase = {
    txHash: 'e1087deb86086b1e8496ab968f99a5530170ed631a534c4d8256329cf454dd70',

    input: {
        inMsgBoc:
            'te6cckECBQEAAQ4AAeWIAAPOI+mE47pQOyxdNKF/avgxvWh9YbJ4Tcg7luVXDla6A5tLO3P///iLShQTaAAAAAwLgww5HSimZ7XvQOb7PfbRnm5uaH32GbNFdbb+ELWLhZwkUvP/wjlKG907QVOAUwG/8fakYMT0E2B3uE2vEAwfAQIKDsPIbQMCAwAAAWhiAFC9XmrYDrIpnVpvUkWdEZgLV9Lg+7dVJpKDrftKYkjqIBfXhAAAAAAAAAAAAAAAAAABBACoD4p+pe5w+sQAAAACMBhqCAE09rrD6bznPlKIejHNcWwNeRhPjI4FhxmqtwCTGqAlFwAAecR9MJx3Sgdli6aUL+1fBjetD6w2Twm5B3LcquHK10ICmd9p7Q==',
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 5012n, cells: 22n },
        timeDelta: 781n // 1765966385 (real utime) - 1765965604 (last_paid)
    },

    expected: {
        gasUsed: 4939n,
        gasFee: 1_975_600n,
        actionFee: 236_263n,
        storageFee: 191n,
        importFee: 1_011_200n,
        fwdFeeRemaining: 472_537n,
        walletFee: 3_695_791n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
