import { beginCell, storeStateInit } from '@ton/core';
import { Network } from '../../entries/network';
import { TonWalletStandard, WalletVersion } from '../../entries/wallet';
import {
    WalletContractV3R1,
    WalletContractV3R2,
    WalletContractV4,
    WalletContractV5Beta,
    WalletContractV5R1
} from '@ton/ton';

export const walletContractFromState = (wallet: TonWalletStandard) => {
    const publicKey = Buffer.from(wallet.publicKey, 'hex');
    return walletContract(publicKey, wallet.version, wallet.network ?? Network.MAINNET);
};

const workchain = 0;

export type WalletContract = ReturnType<typeof walletContract>;

export const walletContract = (
    publicKey: Buffer | string,
    version: WalletVersion,
    network: Network
) => {
    if (typeof publicKey === 'string') {
        publicKey = Buffer.from(publicKey, 'hex');
    }

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
            return WalletContractV5R1.create({
                workchain: workchain,
                walletId: {
                    networkGlobalId: network
                },
                publicKey
            });
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
