import { Cell, beginCell } from '@ton/core';
import queryString from 'query-string';
import { IAppSdk } from '../AppSdk';
import { AppKey } from '../Keys';
import { APIConfig } from '../entries/apis';
import { isW5Version, TonWalletStandard, WalletVersion } from '../entries/wallet';
import { BlockchainApi } from '../tonApiV2';
import { externalMessage, getWalletSeqNo } from './transfer/common';
import { walletContractFromState } from './wallet/contractService';

export const parseSignerSignature = (payload: string): Buffer => {
    console.log('signer', payload);

    if (!payload.startsWith('tonkeeper://publish')) {
        throw new Error(`Unexpected Result: ${payload}`);
    }

    const {
        query: { sign }
    } = queryString.parseUrl(payload);

    if (typeof sign != 'string') {
        throw new Error('Unexpected QR code, missing sign parameter');
    }

    return Buffer.from(sign, 'hex');
};

const walletVersionText = (version: WalletVersion) => {
    switch (version) {
        case WalletVersion.V3R1:
            return 'v3r1';
        case WalletVersion.V3R2:
            return 'v3r2';
        case WalletVersion.V4R2:
            return 'v4r2';
        case WalletVersion.V5_BETA:
            return 'v5beta';
        case WalletVersion.V5R1:
            return 'v5r1';
        default:
            return String(version);
    }
};

export const createTransferQr = (publicKey: string, version: WalletVersion, boc: string) => {
    const body = Buffer.from(boc, 'base64').toString('hex');
    return `tonsign://v1/?network=ton&pk=${publicKey}&body=${body}&v=${walletVersionText(version)}`;
};

export const storeTransactionAndCreateDeepLink = async (
    sdk: IAppSdk,
    publicKey: string,
    version: WalletVersion,
    messageBase64: string
) => {
    await sdk.storage.set(AppKey.SIGNER_MESSAGE, messageBase64);

    const body = Buffer.from(messageBase64, 'base64').toString('hex');
    const back = encodeURIComponent('https://wallet.tonkeeper.com/');
    return `tonsign://v1/?network=ton&pk=${publicKey}&body=${body}&v=${walletVersionText(
        version
    )}&return=${back}`;
};

export const publishSignerMessage = async (
    sdk: IAppSdk,
    api: APIConfig,
    walletState: TonWalletStandard,
    signatureHex: string
) => {
    const messageBase64 = await sdk.storage.get<string>(AppKey.SIGNER_MESSAGE);
    if (!messageBase64) {
        throw new Error('missing message');
    }
    const contract = walletContractFromState(walletState);
    const seqno = await getWalletSeqNo(api, walletState.rawAddress);
    const signature = Buffer.from(signatureHex, 'hex');
    const message = Cell.fromBase64(messageBase64).asSlice();

    const transfer = beginCell();
    if (isW5Version(walletState.version)) {
        transfer.storeSlice(message).storeBuffer(signature);
    } else {
        transfer.storeBuffer(signature).storeSlice(message);
    }

    const external = externalMessage(contract, seqno, transfer.endCell()).toBoc();

    const boc = external.toString('base64');

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc }
    });

    return boc;
};
