import { ethers } from 'ethers';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TronAsset } from '../../entries/crypto/asset/tron-asset';
import { TronRecipient } from '../../entries/send';
import { TronWalletStorage } from '../../entries/wallet';
import {
    Configuration,
    EstimatePayload,
    PublishPayload,
    RequestData,
    TronApi
} from '../../tronApi';
import { hashRequest } from './tronEncoding';
import { getPrivateKey } from './tronService';

async function getEstimatePayload({
    tronApi,
    tron,
    recipient,
    amount
}: {
    tronApi: Configuration;
    tron: TronWalletStorage;
    recipient: TronRecipient;
    amount: AssetAmount<TronAsset>;
}): Promise<EstimatePayload> {
    return new TronApi(tronApi).getEstimation({
        ownerAddress: tron.ownerWalletAddress,
        getEstimationRequest: {
            lifeTime: Math.floor(Date.now() / 1000) + 600,
            messages: [
                {
                    to: recipient.address,
                    value: amount.stringWeiAmount,
                    assetAddress: amount.asset.address
                }
            ]
        }
    });
}

export async function sendTronTransfer(
    {
        tronApi,
        tron,
        request
    }: {
        tronApi: Configuration;
        tron: TronWalletStorage;
        request: RequestData;
    },
    { mnemonic }: { mnemonic: string[] }
): Promise<PublishPayload> {
    const settings = await new TronApi(tronApi).getSettings();

    const hash = hashRequest(request, settings.walletImplementation, settings.chainId);

    const privateKey = await getPrivateKey(mnemonic);
    const signingKey = new ethers.SigningKey('0x' + privateKey);
    const signature = signingKey.sign(hash).serialized;

    return new TronApi(tronApi).publishTransaction({
        ownerAddress: tron.ownerWalletAddress,
        publishTransactionRequest: {
            request,
            signature,
            hash
        }
    });
}

/*async function estimateTronFee({
    wallet,
    tronApi,
    address,
    amount
}: {
    wallet: DeprecatedWalletState;
    tronApi: Configuration;
    address: TronRecipient;
    amount: AssetAmount<TronAsset>;
}) {
    const payload = await getEstimatePayload({
        tron: wallet.tron!,
        tronApi,
        recipient: address,
        amount: new AssetAmount({ asset: amount.asset, weiAmount: new BigNumber('1') })
    });

    return payload.request.fee;
}*/

/*
export async function estimateTron({
    recipient,
    amount,
    isMax,
    tronApi,
    wallet,
    balances
}: {
    recipient: RecipientData;
    amount: AssetAmount<TronAsset>;
    isMax: boolean;
    tronApi: Configuration;
    wallet: DeprecatedWalletState;
    balances: TronBalances | undefined;
}): Promise<TransferEstimation<TronAsset>> {
    if (isMax) {
        const fee = await estimateTronFee({
            wallet,
            tronApi,
            address: recipient.address as TronRecipient,
            amount
        });

        amount = new AssetAmount({ asset: amount.asset, weiAmount: amount.weiAmount.minus(fee) });
    }

    const payload = await getEstimatePayload({
        tron: wallet.tron!,
        tronApi,
        recipient: recipient.address as TronRecipient,
        amount: amount
    });

    if (payload.internalMsgs.some(item => item === false)) {
        throw new Error('Estimation fail.');
    }

    const feeToken = balances?.balances.find(
        item => item.token.address === payload.request.feeToken
    );
    if (!feeToken) {
        throw new Error(`Unexpected feeToken, token's address is ${payload.request.feeToken}`);
    }

    const fee = new AssetAmount({
        asset: toTronAsset(feeToken),
        weiAmount: payload.request.fee
    });

    return { fee, payload };
}
*/
