import { useMutation } from '@tanstack/react-query';
import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';

export const useSubscribeMutation = (
    wallet: TonWalletStandard,
    signTonConnect: (bufferToSign: Buffer) => Promise<Buffer | Uint8Array>,
    onDone: () => void
) => {
    const { api } = useAppContext();
    const sdk = useAppSdk();
    return useMutation(async () => {
        const { notifications } = sdk;
        if (!notifications) {
            throw new Error('Missing notifications');
        }

        try {
            await notifications.subscribe(api, wallet, signTonConnect);

            onDone();
        } catch (e) {
            if (e instanceof Error) {
                sdk.topMessage(e.message);
            }
            throw e;
        }
    });
};
