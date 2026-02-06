/**
 * V4R2 Deploy + Simple TON Transfer
 * https://tonviewer.com/transaction/9cef3b6ed79a0026f702997011dfae56ed1e542869be96433b2a2ee95e10dbc6
 *
 * Wallet: EQDs3oc0TzKxjy5WdyQrrRNgqx-JpkQCdBlZWYi5iV_Q6-tP
 * Destination: UQApwowlR6X54bXoso6orKCzCNm9ily8pAFy5vTwmsQ2WvVi
 * Value: 0.01 TON
 * Deploy: YES (seqno=0, StateInit included)
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';
import { UNINIT_ACCOUNT_STORAGE } from '../../fees';

export const V4R2_DEPLOY_TRANSFER: WalletFeeTestCase = {
    txHash: '9cef3b6ed79a0026f702997011dfae56ed1e542869be96433b2a2ee95e10dbc6',

    input: {
        inMsgBoc:
            'te6cckECFwEAA78AA+OIAdm9DmieZWMeXKzuSFdaJsFWPxNMSAToMyyzEXMSv6HWEZR9QrhoVohsiDIWH/WY1dxOdqwnAvf+v3obhBMYcdEyVVSqyAXvBIhl3JveXrQW/n7NFBiStGX16/QSgf/ZawHlNTRi/////+AAAAAAAHABFRYBFP8A9KQT9LzyyAsCAgEgAxACAUgEBwLm0AHQ0wMhcbCSXwTgItdJwSCSXwTgAtMfIYIQcGx1Z70ighBkc3RyvbCSXwXgA/pAMCD6RAHIygfL/8nQ7UTQgQFA1yH0BDBcgQEI9ApvoTGzkl8H4AXTP8glghBwbHVnupI4MOMNA4IQZHN0crqSXwbjDQUGAHgB+gD0BDD4J28iMFAKoSG+8uBQghBwbHVngx6xcIAYUATLBSbPFlj6Ahn0AMtpF8sfUmDLPyDJgED7AAYAilAEgQEI9Fkw7UTQgQFA1yDIAc8W9ADJ7VQBcrCOI4IQZHN0coMesXCAGFAFywVQA88WI/oCE8tqyx/LP8mAQPsAkl8D4gIBIAgPAgEgCQ4CAVgKCwA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIAwNABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AABG4yX7UTQ1wsfgAWb0kK29qJoQICga5D6AhhHDUCAhHpJN9KZEM5pA+n/mDeBKAG3gQFImHFZ8xhAT48oMI1xgg0x/TH9MfAvgju/Jk7UTQ0x/TH9P/9ATRUUO68qFRUbryogX5AVQQZPkQ8qP4ACSkyMsfUkDLH1Iwy/9SEPQAye1U+A8B0wchwACfbFGTINdKltMH1AL7AOgw4CHAAeMAIcAC4wABwAORMOMNA6TIyx8Syx/L/xESExQAbtIH+gDU1CL5AAXIygcVy//J0Hd0gBjIywXLAiLPFlAF+gIUy2sSzMzJc/sAyEAUgQEI9FHypwIAcIEBCNcY+gDTP8hUIEeBAQj0UfKnghBub3RlcHSAGMjLBcsCUAbPFlAE+gIUy2oSyx/LP8lz+wACAGyBAQjXGPoA0z8wUiSBAQj0WfKnghBkc3RycHSAGMjLBcsCUAXPFlAD+gITy2rLHxLLP8lz+wAACvQAye1UAFEAAAAAKamjF4jE4Brs3Pa3f2iTWmht+POgbEVqVeRb6lTT5vquGk3cQACOYgAU4UYSo9L88Nr0WUdUVlBZhGzexS5eUgC5c3p4TWIbLRzEtAAAAAAAAAAAAAAAAAAAAAAAAFY0UjIgZGVwbG95IHRlc3QU7ERC',
        walletVersion: TonWalletVersion.V4R2,
        storageUsed: UNINIT_ACCOUNT_STORAGE,
        timeDelta: 29189n // 1765901103 - 1765871914 (real tx utime)
    },

    expected: {
        gasUsed: 3308n,
        gasFee: 1_323_200n,
        actionFee: 133_331n,
        storageFee: 269n,
        importFee: 3_740_000n,
        fwdFeeRemaining: 266_669n,
        walletFee: 5_463_469n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
