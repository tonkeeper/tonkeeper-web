import { Address, Cell } from '@ton/core';
import { APIConfig } from '../../entries/apis';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TonAsset } from '../../entries/crypto/asset/ton-asset';
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
    amount: AssetAmount<TonAsset>
): Promise<{ customPayload: Cell | null; stateInit: StateInit }> => {
    const jetton = await new AccountsApi(api.tonApiV2).getAccountJettonBalance({
        accountId: walletAddress,
        jettonId: (amount.asset.address as Address).toRawString()
    });

    if (!seeIfCompressed(jetton)) {
        return { customPayload: null, stateInit: undefined };
    }

    const { customPayload, stateInit } = await new JettonsApi(
        api.tonApiV2
    ).getJettonTransferPayload({
        accountId: walletAddress,
        jettonId: jetton.jetton.address
    });

    if (!customPayload) {
        return { customPayload: null, stateInit: undefined };
    }

    return {
        customPayload: Cell.fromBase64(Buffer.from(customPayload, 'hex').toString('base64')),
        stateInit: stateInit
            ? toStateInit(Buffer.from(stateInit, 'hex').toString('base64'))
            : undefined
    };
};
