import { Cell } from '@ton/core';
import { APIConfig } from '../../entries/apis';
import { AccountsApi, JettonBalance, JettonsApi } from '../../tonApiV2';
import { StateInit, toStateInit } from './common';

export enum JettonExtension {
    NonTransferable = 'non_transferable',
    CustomPayload = 'custom_payload'
}

const seeIfCompressed = (jetton: JettonBalance) => {
    return !!jetton.extensions && jetton.extensions.includes(JettonExtension.CustomPayload);
};

export const getJettonCustomPayload = async (
    api: APIConfig,
    walletAddress: string,
    jettonAddress: string
): Promise<{ customPayload: Cell | null; stateInit: StateInit; jettonWalletAddress: string }> => {
    const jetton = await new AccountsApi(api.tonApiV2).getAccountJettonBalance({
        accountId: walletAddress,
        jettonId: jettonAddress,
        supportedExtensions: ['custom_payload']
    });

    if (!seeIfCompressed(jetton)) {
        return {
            customPayload: null,
            stateInit: undefined,
            jettonWalletAddress: jetton.walletAddress.address
        };
    }

    const { customPayload, stateInit } = await new JettonsApi(
        api.tonApiV2
    ).getJettonTransferPayload({
        accountId: walletAddress,
        jettonId: jetton.jetton.address
    });

    if (!customPayload) {
        return {
            customPayload: null,
            stateInit: undefined,
            jettonWalletAddress: jetton.walletAddress.address
        };
    }

    return {
        customPayload: Cell.fromBase64(Buffer.from(customPayload, 'hex').toString('base64')),
        stateInit: stateInit
            ? toStateInit(Buffer.from(stateInit, 'hex').toString('base64'))
            : undefined,
        jettonWalletAddress: jetton.walletAddress.address
    };
};
