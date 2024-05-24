import { KeystoneSDK } from '@keystonehq/keystone-sdk';
import { KeystoneMessageType, KeystonePathInfo } from './types';

export const constructKeystoneSignRequest = (
    message: Buffer,
    messageType: KeystoneMessageType,
    address: string,
    pathInfo?: KeystonePathInfo
) => {
    const sdk = new KeystoneSDK({ origin: 'TonKeeper' });

    return sdk.ton.generateSignRequest({
        signData: message.toString('hex'),
        dataType: messageType === 'transaction' ? 1 : 2,
        address,
        xfp: pathInfo?.mfp,
        derivationPath: pathInfo?.path
    });
};
