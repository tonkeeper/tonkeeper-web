/**
 * TON blockchain configuration snapshots for testing.
 * Structure matches BlockchainConfig from @ton-api/client.
 *
 * Config keys:
 * - 18: storage_prices
 * - 20/21: gas_limits_prices (masterchain/basechain)
 * - 24/25: msg_forward_prices (masterchain/basechain)
 */
import { FeeBlockchainConfig } from '../../compat';

export const BLOCKCHAIN_CONFIG_2024_12: FeeBlockchainConfig = {
    '18': {
        storagePrices: [
            {
                bitPricePs: 1,
                cellPricePs: 500
            }
        ]
    },
    '21': {
        gasLimitsPrices: {
            gasPrice: 26_214_400
        }
    },
    '25': {
        msgForwardPrices: {
            lumpPrice: 400_000,
            bitPrice: 26_214_400,
            cellPrice: 2_621_440_000,
            firstFrac: 21845
        }
    }
} as const;
