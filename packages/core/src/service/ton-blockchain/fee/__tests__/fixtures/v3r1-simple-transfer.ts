/**
 * V3R1 Simple TON Transfer
 * https://tonviewer.com/transaction/9b431557cc90d4fee34fe8b3afa5cc68baf0afac76d8a603f04bc6eccb0328a3
 *
 * Wallet: EQDxajExFHtCu7AxEu195inKr8ZkI9WDJCzhegKvu2kme2TM
 * Destination: UQApwowlR6X54bXoso6orKCzCNm9ily8pAFy5vTwmsQ2WvVi
 * Value: 0.01 TON
 * seqno: 1 (NOT deploy - no StateInit)
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

export const V3R1_SIMPLE_TRANSFER: WalletFeeTestCase = {
    txHash: '9b431557cc90d4fee34fe8b3afa5cc68baf0afac76d8a603f04bc6eccb0328a3',

    input: {
        inMsgBoc:
            'te6cckEBAgEAvAAB34gB4tRiYij2hXdgYiXa+8xTlV+MyEerBkhZwvQFX3bSTPYBb9MXN6TWOd2BFH0MHHC8e7AbH0XaKpn2ViX8n4vM4b6FN4c0n7CPo8ajbuNmDsu8CxTI7dNwXlW2Rq6V5GEwaU1NGLtKElyAAAAACBwBAI5iABThRhKj0vzw2vRZR1RWUFmEbN7FLl5SALlzenhNYhstHMS0AAAAAAAAAAAAAAAAAAAAAAAAVjNSMSBzaW1wbGUgdGVzdOJYMOI=',
        walletVersion: TonWalletVersion.V3R1,
        storageUsed: { bits: 1195n, cells: 3n },
        timeDelta: 54291n // 1765952100 (send @ 13:15) - 1765897809 (last_paid)
    },

    expected: {
        gasUsed: 2917n,
        gasFee: 1_166_800n,
        actionFee: 133_331n,
        storageFee: 2233n,
        importFee: 667_200n,
        fwdFeeRemaining: 266_669n,
        walletFee: 2_236_233n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
