import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { AuthState } from '@tonkeeper/core/dist/entries/password';
import { getWalletMnemonic } from '@tonkeeper/core/dist/service/mnemonicService';

export const getMnemonic = async (sdk: IAppSdk, publicKey: string) => {
    const auth = await sdk.storage.get<AuthState>(AppKey.PASSWORD);
    if (!auth) {
        throw new Error('Missing Auth');
    }

    switch (auth.kind) {
        case 'none': {
            return await getWalletMnemonic(sdk.storage, publicKey, auth.kind);
        }
        case 'password': {
            const password = await getPasswordByNotification(sdk, auth);
            return await getWalletMnemonic(sdk.storage, publicKey, password);
        }
        default:
            throw new Error('Unexpected auth method');
    }
};

export const getPasswordByNotification = async (sdk: IAppSdk, auth: AuthState): Promise<string> => {
    const id = Date.now();
    return new Promise<string>((resolve, reject) => {
        sdk.uiEvents.emit('getPassword', {
            method: 'getPassword',
            id,
            params: { auth }
        });

        const onCallback = (message: {
            method: 'response';
            id?: number | undefined;
            params: string | Error;
        }) => {
            if (message.id === id) {
                const { params } = message;
                sdk.uiEvents.off('response', onCallback);

                if (typeof params === 'string') {
                    resolve(params);
                } else {
                    reject(params);
                }
            }
        };

        sdk.uiEvents.on('response', onCallback);
    });
};
