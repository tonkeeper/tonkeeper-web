import { useEffect } from 'react';
import { hasWalletAuth } from '@tonkeeper/core/dist/entries/pro';
import { subscriptionFormTempAuth$ } from '@tonkeeper/core/dist/ProAuthTokenService';

import { useAppSdk } from '../appSdk';
import { useAtom } from '../../libs/useAtom';
import { useProState } from '../../state/pro';

export const useTargetAuthUpdate = () => {
    const sdk = useAppSdk();
    const { data: subscription } = useProState();
    const [targetAuth, setTargetAuth] = useAtom(subscriptionFormTempAuth$);

    useEffect(() => {
        if (targetAuth) return;
        if (!subscription) return;
        if (!hasWalletAuth(subscription)) return;

        (async () => {
            const tempToken = await sdk.subscriptionService.getToken();

            if (!tempToken) return;

            setTargetAuth({ ...subscription.auth, tempToken });
        })();
    }, [targetAuth, subscription]);
};
