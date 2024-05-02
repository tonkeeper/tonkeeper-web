import { Cell, beginCell } from '@ton/core';
import { IAppSdk } from '../AppSdk';
import { AppKey } from '../Keys';
import { APIConfig } from '../entries/apis';
import { WalletState, WalletVersion } from '../entries/wallet';
import { BlockchainApi } from '../tonApiV2';
import { externalMessage, getWalletSeqNo } from './transfer/common';
import { walletContractFromState } from './wallet/contractService';

export const parseSignerSignature = (payload: string): Buffer => {
    console.log('signer', payload);
    if (payload.startsWith('tonkeeper://publish?boc=')) {
        const base64Signature = decodeURIComponent(
            payload.substring('tonkeeper://publish?boc='.length)
        );
        return Buffer.from(base64Signature, 'base64');
    } else {
        throw new Error(`Unexpected Result: ${payload}`);
    }
};

export const storeTransactionAndCreateDeepLink = async (
    sdk: IAppSdk,
    publicKey: string,
    messageBase64: string
) => {
    await sdk.storage.set(AppKey.SIGNER_MESSAGE, messageBase64);

    return `tonsign://?network=ton&pk=${encodeURIComponent(publicKey)}&body=${encodeURIComponent(
        messageBase64
    )}&return=https://wallet.tonkeeper.com/`;
};

export const publishSignerMessage = async (
    sdk: IAppSdk,
    api: APIConfig,
    walletState: WalletState,
    signatureBase64: string
) => {
    const messageBase64 = await sdk.storage.get<string>(AppKey.SIGNER_MESSAGE);
    if (!messageBase64) {
        throw new Error('missing message');
    }
    const contract = walletContractFromState(walletState);
    const seqno = await getWalletSeqNo(api, walletState.active.rawAddress);
    const signature = Buffer.from(decodeURIComponent(signatureBase64), 'base64');
    const message = Cell.fromBase64(messageBase64).asBuilder();

    const transfer = beginCell();
    if (walletState.active.version === WalletVersion.W5) {
        transfer.storeBuilder(message).storeBuffer(signature);
    } else {
        transfer.storeBuffer(signature).storeBuilder(message);
    }

    const external = externalMessage(contract, seqno, transfer.endCell()).toBoc({ idx: false });

    const boc = external.toString('base64');

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc }
    });

    return boc;
};
