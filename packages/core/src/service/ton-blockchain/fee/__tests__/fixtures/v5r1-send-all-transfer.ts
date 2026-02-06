/**
 * V5R1 Send All Balance Transfer
 * https://tonviewer.com/transaction/9fc34b1f3bbea2afb2077224258c875b66fe468219d13eed32318aa3d72d2d2f
 *
 * Wallet: UQBNUQQgFaC_XgIvEY-OcH_M5bMzrmlgFEBwHyI1fxVW-_d4
 * Destination: UQApwowlR6X54bXoso6orKCzCNm9ily8pAFy5vTwmsQ2WvVi
 * Value: ALL (entire balance ~0.37 TON)
 * seqno: 5
 * Send mode: 130 (CARRY_ALL_REMAINING_BALANCE + IGNORE_ERRORS)
 *
 * Purpose: Test fee estimation for send-all mode.
 * Verifies that sendMode doesn't affect gas calculation.
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

export const V5R1_SEND_ALL_TRANSFER: WalletFeeTestCase = {
    txHash: '9fc34b1f3bbea2afb2077224258c875b66fe468219d13eed32318aa3d72d2d2f',

    input: {
        inMsgBoc:
            'te6cckEBBAEAzAAB5YgAmqIIQCtBfrwEXiMfHOD/mctmZ1zSwCiA4D5Eav4qrfYDm0s7c///+ItKHuwwAAAALfm0UY5F646ThNTsVr5U1IpRiC2u40xbyGULBnenEi1OTCLRUcM9pCL9qzGl3Rwlm9hyB2RG+YNERLvVrRjSsg0BAgoOw8htggIDAAAAkmIAFOFGEqPS/PDa9FlHVFZQWYRs3sUuXlIAuXN6eE1iGy0YehIAAAAAAAAAAAAAAAAAAAAAAABWNVIxIHNlbmQtYWxsIHRlc3Rw/eVR',
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 5012n, cells: 22n },
        timeDelta: 3488n // utime(1766055009) - last_paid(1766051521)
    },

    expected: {
        gasUsed: 4939n,
        gasFee: 1_975_600n,
        actionFee: 133_331n,
        storageFee: 853n,
        importFee: 769_600n,
        fwdFeeRemaining: 266_669n,
        walletFee: 3_146_053n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
