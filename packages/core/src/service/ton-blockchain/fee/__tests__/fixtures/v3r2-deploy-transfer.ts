/**
 * V3R2 Deploy + Simple TON Transfer
 * https://tonviewer.com/transaction/c222ab3fd903f3e14e89f571d7fc4662036150381675b31f14dc62eb7955abae
 *
 * Wallet: UQCscC8Yeutc-J4LJFsRsFsUKM8qerLuCx7TRUl9tjqVLYym
 * Destination: UQApwowlR6X54bXoso6orKCzCNm9ily8pAFy5vTwmsQ2WvVi
 * Value: 0.01 TON
 * Deploy: YES (seqno=0, StateInit included)
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';
import { UNINIT_ACCOUNT_STORAGE } from '../../fees';

export const V3R2_DEPLOY_TRANSFER: WalletFeeTestCase = {
    txHash: 'a3c4513865506e14d8eb05e0c2e508827125d615384bbb1f91b19c2147088c99',

    input: {
        inMsgBoc:
            'te6cckECBAEAAVoAA+GIAIsnKI2/Ydv224kGOyL5OxA6n5UHvq0OkDx3hT+yvytaEYeccEtypc03z0Rh18v2sNOdvavY009n1UlBH0rd5oZPI7LZzgEdRGHhsFEwt5WlK8Okip/eG7g6a/GWGbNcceAFNTRi/////+AAAAAAcAECAwDe/wAg3SCCAUyXuiGCATOcurGfcbDtRNDTH9MfMdcL/+ME4KTyYIMI1xgg0x/TH9Mf+CMTu/Jj7UTQ0x/TH9P/0VEyuvKhUUS68qIE+QFUEFX5EPKj+ACTINdKltMH1AL7AOjRAaTIyx/LH8v/ye1UAFAAAAAAKamjF4jE4Brs3Pa3f2iTWmht+POgbEVqVeRb6lTT5vquGk3cAI5iABThRhKj0vzw2vRZR1RWUFmEbN7FLl5SALlzenhNYhstHMS0AAAAAAAAAAAAAAAAAAAAAAAAVjNSMiBkZXBsb3kgdGVzdKcWeY4=',
        walletVersion: TonWalletVersion.V3R2,
        storageUsed: UNINIT_ACCOUNT_STORAGE,
        timeDelta: 25861n // 1765897812 - 1765871951 (~7.2h since funding)
    },

    expected: {
        gasUsed: 2994n,
        gasFee: 1_197_600n,
        actionFee: 133_331n,
        storageFee: 238n,
        importFee: 1_230_400n,
        fwdFeeRemaining: 266_669n,
        walletFee: 2_828_238n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
