import { isPaidSubscription } from '@tonkeeper/core/dist/entries/pro';

import { useProState } from '../../state/pro';
import { useActiveWallet } from '../../state/wallet';

export const useDeleteActiveWalletWarning = () => {
    const { data: subscription } = useProState();
    const activeWallet = useActiveWallet();

    return {
        isWarningVisible:
            isPaidSubscription(subscription) &&
            activeWallet?.rawAddress === subscription?.auth?.wallet?.rawAddress
    };
};
