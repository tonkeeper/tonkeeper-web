import { IAppSdk } from '../AppSdk';
import { AppKey } from '../Keys';

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
