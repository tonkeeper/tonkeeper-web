/**
 * V5R1 Deploy + Simple TON Transfer
 * https://tonviewer.com/transaction/8b399b6f07adfff9ebbc993f3e31955d28d01a0eca4e95927d221f793e01d5bb
 *
 * Wallet: EQDor2YEgMtWo1XgbPzSLPR0JS1yHsvLMr2Y_MhSK267ysoV
 * Destination: UQApwowlR6X54bXoso6orKCzCNm9ily8pAFy5vTwmsQ2WvVi
 * Value: 0.01 TON
 * Deploy: YES (seqno=0, StateInit included)
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';
import { UNINIT_ACCOUNT_STORAGE } from '../../fees';

export const V5R1_DEPLOY_TRANSFER: WalletFeeTestCase = {
    txHash: '8b399b6f07adfff9ebbc993f3e31955d28d01a0eca4e95927d221f793e01d5bb',

    input: {
        inMsgBoc:
            'te6cckECGQEAA3kAA+eIAdFezAkBlq1Gq8DZ+aRZ6OhKWuQ9l5ZlezH5kKRW3XeUEY5tLO3P///iP////+AAAAAXRMD9rgTSL3siUO+VNqBj+rGQeQcxIl4tznudt+z+R7es1YgWsujT2Y5/87YkjeecfaLUxVnEk9b9Q4Oj8WD4RAEVFgEU/wD0pBP0vPLICwICASADDgIBSAQFAtzQINdJwSCRW49jINcLHyCCEGV4dG69IYIQc2ludL2wkl8D4IIQZXh0brqOtIAg1yEB0HTXIfpAMPpE+Cj6RDBYvZFb4O1E0IEBQdch9AWDB/QOb6ExkTDhgEDXIXB/2zzgMSDXSYECgLmRMOBw4hEQAgEgBg0CASAHCgIBbggJABmtznaiaEAg65Drhf/AABmvHfaiaEAQ65DrhY/AAgFICwwAF7Ml+1E0HHXIdcLH4AARsmL7UTQ1woAgABm+Xw9qJoQICg65D6AsAQLyDwEeINcLH4IQc2lnbrry4Ip/EAHmjvDtou37IYMI1yICgwjXIyCAINch0x/TH9Mf7UTQ0gDTHyDTH9P/1woACvkBQMz5EJoolF8K2zHh8sCH3wKzUAew8tCEUSW68uCFUDa68uCG+CO78tCIIpL4AN4BpH/IygDLHwHPFsntVCCS+A/ecNs82BED9u2i7fsC9AQhbpJsIY5MAiHXOTBwlCHHALOOLQHXKCB2HkNsINdJwAjy4JMg10rAAvLgkyDXHQbHEsIAUjCw8tCJ10zXOTABpOhsEoQHu/Lgk9dKwADy4JPtVeLSAAHAAJFb4OvXLAgUIJFwlgHXLAgcEuJSELHjDyDXShITFACWAfpAAfpE+Cj6RDBYuvLgke1E0IEBQdcY9AUEnX/IygBABIMH9FPy4IuOFAODB/Rb8uCMItcKACFuAbOw8tCQ4shQA88WEvQAye1UAHIw1ywIJI4tIfLgktIA7UTQ0gBRE7ry0I9UUDCRMZwBgQFA1yHXCgDy4I7iyMoAWM8Wye1Uk/LAjeIAEJNb2zHh10zQAFGAAAAAP///iMRicA12bntbv7RJrTQ2/HnQNiK1KvIt9Spp831XDSbuIAIKDsPIbQMXGAAAAI5iABThRhKj0vzw2vRZR1RWUFmEbN7FLl5SALlzenhNYhstHMS0AAAAAAAAAAAAAAAAAAAAAAAAVjVSMSBkZXBsb3kgdGVzdB3rhBA=',
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: UNINIT_ACCOUNT_STORAGE,
        timeDelta: 5014n // 1765901103 - 1765896089 (real tx utime)
    },

    expected: {
        gasUsed: 4939n,
        gasFee: 1_975_600n,
        actionFee: 133_331n,
        storageFee: 47n,
        importFee: 3_565_200n,
        fwdFeeRemaining: 266_669n,
        walletFee: 5_940_847n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
