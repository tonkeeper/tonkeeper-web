/**
 * V5R1 Deploy + Jetton Transfer (POSASYVAET)
 * https://tonviewer.com/transaction/4f148ce4f6ea7673dd7dce81e2f0cd23ca5e2e5baa68fa36ba0c689f324ce3ab
 *
 * Wallet: UQAB5xH0wnHdKB2WLppQv7V8GN60PrDZPCbkHctyq4crXbYy
 * Jetton: POSASYVAET (EQBR-4-x7dik6UIHSf_IE6y2i7LdPrt3dLtoilA8sObIquW8)
 * Recipient: UQCae11h9N5znylEPRjmuLYGvIwnxkcCw4zVW4BJjVASi5eL
 * Deploy: YES (seqno=0, StateInit included)
 * Send mode: 3 (PAY_GAS_SEPARATELY + IGNORE_ERRORS)
 *
 * Purpose: Validate fee calculation for jetton transfer with wallet deployment
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

export const V5R1_JETTON_DEPLOY_TRANSFER: WalletFeeTestCase = {
    txHash: '4f148ce4f6ea7673dd7dce81e2f0cd23ca5e2e5baa68fa36ba0c689f324ce3ab',

    input: {
        inMsgBoc:
            'te6cckECGgEAA70AA+eIAAPOI+mE47pQOyxdNKF/avgxvWh9YbJ4Tcg7luVXDla6EY5tLO3P///iP////+AAAAAUXT6I0OuBJ/Jj8s0J5LMQqDo1L3ljAh2adGyCpls7/OX2XlaRAhVWxGZN+2wThSA7EULv22lQcfiEksiBwREQXAEVFgEU/wD0pBP0vPLICwICASADDgIBSAQFAtzQINdJwSCRW49jINcLHyCCEGV4dG69IYIQc2ludL2wkl8D4IIQZXh0brqOtIAg1yEB0HTXIfpAMPpE+Cj6RDBYvZFb4O1E0IEBQdch9AWDB/QOb6ExkTDhgEDXIXB/2zzgMSDXSYECgLmRMOBw4hEQAgEgBg0CASAHCgIBbggJABmtznaiaEAg65Drhf/AABmvHfaiaEAQ65DrhY/AAgFICwwAF7Ml+1E0HHXIdcLH4AARsmL7UTQ1woAgABm+Xw9qJoQICg65D6AsAQLyDwEeINcLH4IQc2lnbrry4Ip/EAHmjvDtou37IYMI1yICgwjXIyCAINch0x/TH9Mf7UTQ0gDTHyDTH9P/1woACvkBQMz5EJoolF8K2zHh8sCH3wKzUAew8tCEUSW68uCFUDa68uCG+CO78tCIIpL4AN4BpH/IygDLHwHPFsntVCCS+A/ecNs82BED9u2i7fsC9AQhbpJsIY5MAiHXOTBwlCHHALOOLQHXKCB2HkNsINdJwAjy4JMg10rAAvLgkyDXHQbHEsIAUjCw8tCJ10zXOTABpOhsEoQHu/Lgk9dKwADy4JPtVeLSAAHAAJFb4OvXLAgUIJFwlgHXLAgcEuJSELHjDyDXShITFACWAfpAAfpE+Cj6RDBYuvLgke1E0IEBQdcY9AUEnX/IygBABIMH9FPy4IuOFAODB/Rb8uCMItcKACFuAbOw8tCQ4shQA88WEvQAye1UAHIw1ywIJI4tIfLgktIA7UTQ0gBRE7ry0I9UUDCRMZwBgQFA1yHXCgDy4I7iyMoAWM8Wye1Uk/LAjeIAEJNb2zHh10zQAFGAAAAAP///iKJlC4pYpKjPnRwcPVBteZ/STb08sAm+NV8fKC+V2lhkoAIKDsPIbQMXGAAAAWhiAG86P6y6gCm5XLH3xO0tXwqnOO8/zrgSt4FIXPzeWbKfIBfXhAAAAAAAAAAAAAAAAAABGQCoD4p+pe5w+sQAAAABOYloCAE09rrD6bznPlKIejHNcWwNeRhPjI4FhxmqtwCTGqAlFwAAecR9MJx3Sgdli6aUL+1fBjetD6w2Twm5B3LcquHK10ICvS+pMw==',
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 103n, cells: 1n },
        timeDelta: 1454n // 1765965604 - 1765964150 (real tx utime - last_paid)
    },

    expected: {
        gasUsed: 4939n,
        gasFee: 1_975_600n,
        actionFee: 236_263n,
        storageFee: 14n,
        importFee: 3_813_200n,
        fwdFeeRemaining: 472_537n,
        walletFee: 6_497_614n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
