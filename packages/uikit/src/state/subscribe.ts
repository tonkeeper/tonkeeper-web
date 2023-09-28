import { useMutation } from '@tanstack/react-query';
import { useAppSdk } from '../hooks/appSdk';

export const useSubscribeMutation = (wallet: string, mnemonic: string[], onDone: () => void) => {
    const sdk = useAppSdk();
    return useMutation(async () => {
        try {
            await sdk.notifications!.subscribe(wallet, mnemonic);
            sdk.topMessage('subscribed');
            onDone();
        } catch (e) {
            if (e instanceof Error) {
                sdk.topMessage(e.message + ' ' + e.stack);
            }
            throw e;
        }
    });
};
