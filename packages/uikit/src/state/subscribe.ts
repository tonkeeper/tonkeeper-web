import { useMutation } from '@tanstack/react-query';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { setSubscribed } from '@tonkeeper/core/dist/service/subscriptionService';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import { useAppSdk } from '../hooks/appSdk';

export const useSubscribeMutation = (
    wallet: WalletState,
    mnemonic: string[],
    onDone: () => void
) => {
    const sdk = useAppSdk();
    return useMutation(async () => {
        try {
            const address = formatAddress(wallet.active.rawAddress);
            await sdk.notifications?.subscribe(address, mnemonic);
            await setSubscribed(sdk.storage, address, true);

            onDone();
        } catch (e) {
            if (e instanceof Error) {
                sdk.topMessage(e.message);
            }
            throw e;
        }
    });
};
