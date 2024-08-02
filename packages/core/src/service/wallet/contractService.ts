import { beginCell, storeStateInit } from '@ton/core';
import { WalletContractV3R1 } from '@ton/ton/dist/wallets/WalletContractV3R1';
import { WalletContractV3R2 } from '@ton/ton/dist/wallets/WalletContractV3R2';
import { WalletContractV4 } from '@ton/ton/dist/wallets/WalletContractV4';
import { WalletContractV5Beta } from '@ton/ton/dist/wallets/WalletContractV5Beta';
import { WalletContractV5R1 } from '@ton/ton/dist/wallets/WalletContractV5R1';
import { Network } from '../../entries/network';
import { TonWalletStandard, WalletVersion } from '../../entries/wallet';

export const walletContractFromState = (wallet: TonWalletStandard) => {
    const publicKey = Buffer.from(wallet.publicKey, 'hex');
    return walletContract(publicKey, wallet.version);
};

const workchain = 0;

export type WalletContract = ReturnType<typeof walletContract>;

export const walletContract = (
    publicKey: Buffer,
    version: WalletVersion,
    network = Network.MAINNET
) => {
    switch (version) {
        case WalletVersion.V3R1:
            return WalletContractV3R1.create({ workchain, publicKey });
        case WalletVersion.V3R2:
            return WalletContractV3R2.create({ workchain, publicKey });
        case WalletVersion.V4R1:
            throw new Error('Unsupported wallet contract version - v4R1');
        case WalletVersion.V4R2:
            return WalletContractV4.create({ workchain, publicKey });
        case WalletVersion.V5_BETA:
            return WalletContractV5Beta.create({
                walletId: {
                    networkGlobalId: network
                },
                publicKey
            });
        case WalletVersion.V5R1:
            return WalletContractV5R1.create({ workChain: workchain, publicKey });
    }
};

export const walletStateInitFromState = (wallet: TonWalletStandard) => {
    const contract = walletContractFromState(wallet);

    return beginCell()
        .store(storeStateInit(contract.init))
        .endCell()
        .toBoc({ idx: false })
        .toString('base64');
};
