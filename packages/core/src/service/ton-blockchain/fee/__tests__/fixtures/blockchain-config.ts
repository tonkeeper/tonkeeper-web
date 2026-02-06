/* eslint-disable prettier/prettier */
/**
 * TON blockchain configuration snapshot for testing (mainnet, December 2024).
 *
 * Values sourced from https://tonviewer.com/config
 * TL-B definitions: https://github.com/ton-blockchain/ton/blob/master/crypto/block/block.tlb
 *
 * ConfigParam 18: StoragePrices (bit_price_ps / mc_bit_price_ps, cell_price_ps / mc_cell_price_ps)
 * ConfigParam 20/21: GasLimitsPrices.gas_price (masterchain / basechain)
 * ConfigParam 24/25: MsgForwardPrices (masterchain / basechain)
 */
import { FeeConfig } from '../../fees';

export const BLOCKCHAIN_CONFIG_2024_12: FeeConfig = {
    basechain: {
        gasPrice: 26_214_400n,          // ConfigParam 21
        storageBitPrice: 1n,            // ConfigParam 18: bit_price_ps
        storageCellPrice: 500n,         // ConfigParam 18: cell_price_ps
        fwd: {                          // ConfigParam 25
            lumpPrice: 400_000n,
            bitPrice: 26_214_400n,
            cellPrice: 2_621_440_000n,
            firstFrac: 21_845n
        }
    },
    masterchain: {
        gasPrice: 655_360_000n,         // ConfigParam 20
        storageBitPrice: 1_000n,        // ConfigParam 18: mc_bit_price_ps
        storageCellPrice: 500_000n,     // ConfigParam 18: mc_cell_price_ps
        fwd: {                          // ConfigParam 24
            lumpPrice: 10_000_000n,
            bitPrice: 655_360_000n,
            cellPrice: 65_536_000_000n,
            firstFrac: 21_845n
        }
    }
};
