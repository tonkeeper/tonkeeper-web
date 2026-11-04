import { WalletContractV3R1 } from '@ton/ton/dist/wallets/WalletContractV3R1';
import { WalletContractV3R2 } from '@ton/ton/dist/wallets/WalletContractV3R2';
import { WalletContractV4 } from '@ton/ton/dist/wallets/WalletContractV4';
import { WalletContractV5Beta } from '@ton/ton/dist/wallets/WalletContractV5Beta';
import { WalletContractV5R1 } from '@ton/ton/dist/wallets/WalletContractV5R1';

import { Network } from '../../../entries/network';
import { WalletVersion } from '../../../entries/wallet';
import { WalletContractStrategy } from './types';

const workchain = 0;

export interface TonWalletContractArgs {
    publicKey: Buffer | string;
    version: WalletVersion;
    network: Network;
}

export type TonWalletContract =
    | ReturnType<typeof WalletContractV3R1.create>
    | ReturnType<typeof WalletContractV3R2.create>
    | ReturnType<typeof WalletContractV4.create>
    | ReturnType<typeof WalletContractV5Beta.create>
    | ReturnType<typeof WalletContractV5R1.create>;

/**
 * TON wallet contract strategy. Wraps the original `walletContract()`
 * switch; the sign-snapshot harness verifies state-init and transfer
 * BOCs are byte-identical to the pre-refactor output.
 */
export const tonWalletContractStrategy: WalletContractStrategy<
    TonWalletContractArgs,
    TonWalletContract
> = {
    chain: 'ton',
    create({ publicKey, version, network }) {
        const pk = typeof publicKey === 'string' ? Buffer.from(publicKey, 'hex') : publicKey;

        switch (version) {
            case WalletVersion.V3R1:
                return WalletContractV3R1.create({ workchain, publicKey: pk });
            case WalletVersion.V3R2:
                return WalletContractV3R2.create({ workchain, publicKey: pk });
            case WalletVersion.V4R1:
                throw new Error('Unsupported wallet contract version - v4R1');
            case WalletVersion.V4R2:
                return WalletContractV4.create({ workchain, publicKey: pk });
            case WalletVersion.V5_BETA:
                return WalletContractV5Beta.create({
                    walletId: {
                        networkGlobalId: network
                    },
                    publicKey: pk
                });
            case WalletVersion.V5R1:
                return WalletContractV5R1.create({
                    workchain,
                    walletId: {
                        networkGlobalId: network
                    },
                    publicKey: pk
                });
        }
    }
};
