import { useMutation } from '@tanstack/react-query';
import { StandardTonWalletState } from '@tonkeeper/core/dist/entries/wallet';
import { useAppSdk } from '../hooks/appSdk';

export const useSubscribeMutation = (
    wallet: StandardTonWalletState,
    mnemonic: string[],
    onDone: () => void
) => {
    const sdk = useAppSdk();
    return useMutation(async () => {
        const { notifications } = sdk;
        if (!notifications) {
            throw new Error('Missing notifications');
        }

        try {
            await notifications.subscribe(wallet, mnemonic);

            onDone();
        } catch (e) {
            if (e instanceof Error) {
                sdk.topMessage(e.message);
            }
            throw e;
        }
    });
};
