/**
 * V4R2 Simple TON Transfer
 * https://tonviewer.com/transaction/da87f551960c619ce4a00737d84c3ac087d311e30b3d0f0a481b6c528f639a11
 *
 * Wallet: EQDs3oc0TzKxjy5WdyQrrRNgqx-JpiQCdBmWWYi5iV_Q62Yc
 * Destination: UQApwowlR6X54bXoso6orKCzCNm9ily8pAFy5vTwmsQ2WvVi
 * Value: 0.01 TON
 * seqno: 1 (NOT deploy - no StateInit)
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

export const V4R2_SIMPLE_TRANSFER: WalletFeeTestCase = {
    txHash: 'da87f551960c619ce4a00737d84c3ac087d311e30b3d0f0a481b6c528f639a11',

    input: {
        inMsgBoc:
            'te6cckEBAgEAvQAB4YgB2b0OaJ5lYx5crO5IV1omwVY/E0xIBOgzLLMRcxK/odYA/yGGDBicSwhIT4Px0xBMWKKXCRIh4qn6VaY0lmXkTTLKlvg+tIAxGf5fP04JxrwPT9EPGvHt/vwE+TsvkouoQU1NGLtKErSgAAAACAAcAQCOYgAU4UYSo9L88Nr0WUdUVlBZhGzexS5eUgC5c3p4TWIbLRzEtAAAAAAAAAAAAAAAAAAAAAAAAFY0UjIgc2ltcGxlIHRlc3QPg4u7',
        walletVersion: TonWalletVersion.V4R2,
        storageUsed: { bits: 5689n, cells: 22n },
        timeDelta: 53817n // 1765954920 (utime) - 1765901103 (last_paid)
    },

    expected: {
        gasUsed: 3308n,
        gasFee: 1_323_200n,
        actionFee: 133_331n,
        storageFee: 13_705n,
        importFee: 667_200n,
        fwdFeeRemaining: 266_669n,
        walletFee: 2_404_105n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
