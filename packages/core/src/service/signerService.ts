import { Cell, beginCell } from '@ton/core';
import queryString from 'query-string';
import { IAppSdk } from '../AppSdk';
import { AppKey } from '../Keys';
import { APIConfig } from '../entries/apis';
import { WalletState, WalletVersion } from '../entries/wallet';
import { BlockchainApi } from '../tonApiV2';
import { externalMessage, getWalletSeqNo } from './transfer/common';
import { walletContractFromState } from './wallet/contractService';

export const parseSignerSignature = (payload: string): Buffer => {
    console.log('signer', payload);

    if (!payload.startsWith('tonkeeper://publish')) {
        throw new Error(`Unexpected Result: ${payload}`);
    }

    const {
        query: { boc }
    } = queryString.parseUrl(payload);

    if (typeof boc != 'string') {
        throw new Error('Unexpected QR code, missing boc parameter');
    }

    return Buffer.from(boc, 'base64');
};

export const createTransferQr = (publicKey: string, boc: string) => {
    const pk = encodeURIComponent(Buffer.from(publicKey, 'hex').toString('base64'));
    const body = encodeURIComponent(boc);
    return `tonsign://?network=ton&pk=${pk}&body=${body}`;
};

export const storeTransactionAndCreateDeepLink = async (
    sdk: IAppSdk,
    publicKey: string,
    messageBase64: string
) => {
    await sdk.storage.set(AppKey.SIGNER_MESSAGE, messageBase64);

    const pk = encodeURIComponent(Buffer.from(publicKey, 'hex').toString('base64'));
    const body = encodeURIComponent(messageBase64);
    const back = encodeURIComponent('https://wallet.tonkeeper.com/');
    return `tonsign://?network=ton&pk=${pk}&body=${body}&return=${back}`;
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
