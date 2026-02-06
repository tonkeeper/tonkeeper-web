/**
 * V3R1 Deploy + Simple TON Transfer
 * https://tonviewer.com/transaction/d43bd4a7a00ee3160cd266013020a126f5662094ed8b10fd54ea7ee56c64ef2d
 *
 * Wallet: UQAuxK2L3BqMiY8KOTxDYvLTWS64R6gD0Xh_Ar8MTOmaIjBa
 * Destination: UQApwowlR6X54bXoso6orKCzCNm9ily8pAFy5vTwmsQ2WvVi
 * Value: 0.01 TON
 * Deploy: YES (seqno=0, StateInit included)
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';
import { UNINIT_ACCOUNT_STORAGE } from '../../fees';

// === Export ===

export const V3R1_DEPLOY_TRANSFER: WalletFeeTestCase = {
    txHash: '56d703d5a575c1ebebc1ca4c4d53a0fe153868f1819e90dce5454aaa60f85cbe',

    input: {
        inMsgBoc:
            'te6cckECBAEAAUsAA+GIAeLUYmIo9oV3YGIl2vvMU5VfjMhHqwZIWcL0BV920kz2EZAlKodvdHYSVEbp2r8c7Ovqg9QjJz6RTyYGGJmk1EbVcqKWiZ/4OROX1EHhkLSDTpPgt4wwrrxtrfORRdd+8qBlNTRi/////+AAAAAAcAECAwDA/wAg3SCCAUyXupcw7UTQ1wsf4KTyYIMI1xgg0x/TH9Mf+CMTu/Jj7UTQ0x/TH9P/0VEyuvKhUUS68qIE+QFUEFX5EPKj+ACTINdKltMH1AL7AOjRAaTIyx/LH8v/ye1UAFAAAAAAKamjF4jE4Brs3Pa3f2iTWmht+POgbEVqVeRb6lTT5vquGk3cAI5iABThRhKj0vzw2vRZR1RWUFmEbN7FLl5SALlzenhNYhstHMS0AAAAAAAAAAAAAAAAAAAAAAAAVjNSMSBkZXBsb3kgdGVzdCOmdwU=',
        walletVersion: TonWalletVersion.V3R1,
        storageUsed: UNINIT_ACCOUNT_STORAGE,
        timeDelta: 25832n // 1765897809 - 1765871977 (~7.2h since funding)
    },

    expected: {
        gasUsed: 2917n,
        gasFee: 1_166_800n,
        actionFee: 133_331n,
        storageFee: 238n,
        importFee: 1_182_400n,
        fwdFeeRemaining: 266_669n,
        walletFee: 2_749_438n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
