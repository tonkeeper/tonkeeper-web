/**
 * V3R2 Simple TON Transfer
 * https://tonviewer.com/transaction/2fa6487aaf22906418d98a8e20cb0c8fa1fb78c4d31661fb3ebc504ab5c9f9f7
 *
 * Wallet: EQBFk5RG37Dt-23Egx2RfJ2IHU_Kg99Wh0geO8Kf2V-VrSXr
 * Destination: UQApwowlR6X54bXoso6orKCzCNm9ily8pAFy5vTwmsQ2WvVi
 * Value: 0.01 TON
 * seqno: 1 (NOT deploy - no StateInit)
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

export const V3R2_SIMPLE_TRANSFER: WalletFeeTestCase = {
    txHash: '2fa6487aaf22906418d98a8e20cb0c8fa1fb78c4d31661fb3ebc504ab5c9f9f7',

    input: {
        inMsgBoc:
            'te6cckEBAgEAvAAB34gAiycojb9h2/bbiQY7Ivk7EDqflQe+rQ6QPHeFP7K/K1oGN2uEUMoi+OFETECx05z1AFr7rFZqUgxapDpSA0ZyN4et1EkPIow8h6Dwqgw/NXaa33DrEQJp9WT5aouP4q54SU1NGLtKEqPAAAAACBwBAI5iABThRhKj0vzw2vRZR1RWUFmEbN7FLl5SALlzenhNYhstHMS0AAAAAAAAAAAAAAAAAAAAAAAAVjNSMiBzaW1wbGUgdGVzdI5CrMA=',
        walletVersion: TonWalletVersion.V3R2,
        storageUsed: { bits: 1315n, cells: 3n },
        timeDelta: 56575n // 1765954387 (utime) - 1765897812 (last_paid)
    },

    expected: {
        gasUsed: 2994n,
        gasFee: 1_197_600n,
        actionFee: 133_331n,
        storageFee: 2_431n,
        importFee: 667_200n,
        fwdFeeRemaining: 266_669n,
        walletFee: 2_267_231n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
