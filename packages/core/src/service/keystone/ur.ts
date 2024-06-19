import { KeystoneTonSDK } from '@keystonehq/keystone-sdk/dist/chains/ton';
import { KeystoneMessageType, KeystonePathInfo } from './types';

export const constructKeystoneSignRequest = (
    message: Buffer,
    messageType: KeystoneMessageType,
    address: string,
    pathInfo?: KeystonePathInfo
) => {
    const tonSdk = new KeystoneTonSDK({ origin: 'TonKeeper' });
    return tonSdk.generateSignRequest({
        signData: message.toString('hex'),
        dataType: messageType === 'transaction' ? 1 : 2,
        address,
        xfp: pathInfo?.mfp,
        derivationPath: pathInfo?.path
    });
};
