/**
 * V4R2 Multi-message TON Transfer (3 messages)
 * https://tonviewer.com/transaction/f746a4a6347a56ad128bcd8e17831bbbd9776b0522c764e4c672512fa053196d
 *
 * Wallet: EQDs3oc0TzKxjy5WdyQrrRNgqx-JpiQCdBmWWYi5iV_Q62Yc
 * Destinations: 3 different addresses
 * Value: 0.01 TON each
 * seqno: 2
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 *
 * Purpose: Validate gas formula gasUsed = baseGas + gasPerMsg * outMsgsCount
 * Expected: gasUsed = 2666 + 642*3 = 4592
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

export const V4R2_MULTI_TRANSFER: WalletFeeTestCase = {
    txHash: 'f746a4a6347a56ad128bcd8e17831bbbd9776b0522c764e4c672512fa053196d',

    input: {
        inMsgBoc:
            'te6cckECBAEAAVYAA+WIAdm9DmieZWMeXKzuSFdaJsFWPxNMSAToMyyzEXMSv6HWAWW792PeJs2k3RpePkQV3QSb7A76RXTzp7YyH7Hl3TE5Xl23gFlLONfJWsx/ruBNK24WPIX/mjYtHdgkvYuGSAFNTRi7ShN44AAAABAAGBgcAQIDAJBiABThRhKj0vzw2vRZR1RWUFmEbN7FLl5SALlzenhNYhstHMS0AAAAAAAAAAAAAAAAAAAAAAAAVjRSMiBtdWx0aSB0ZXN0IDEAkGIAeLUYmIo9oV3YGIl2vvMU5VfjMhHqwZIWcL0BV920kz2cxLQAAAAAAAAAAAAAAAAAAAAAAABWNFIyIG11bHRpIHRlc3QgMgCQYgAiycojb9h2/bbiQY7Ivk7EDqflQe+rQ6QPHeFP7K/K1pzEtAAAAAAAAAAAAAAAAAAAAAAAAFY0UjIgbXVsdGkgdGVzdCAzaX8lDA==',
        walletVersion: TonWalletVersion.V4R2,
        storageUsed: { bits: 5689n, cells: 22n },
        timeDelta: 650n // 1765961110 (utime) - 1765960460 (last_paid)
    },

    expected: {
        gasUsed: 4592n, // 2666 + 642*3
        gasFee: 1_836_800n,
        actionFee: 399_993n,
        storageFee: 166n,
        importFee: 1_211_200n,
        fwdFeeRemaining: 800_007n,
        walletFee: 4_248_166n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
