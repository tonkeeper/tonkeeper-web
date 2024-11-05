import { useMutation } from '@tanstack/react-query';
import { useAppContext } from '../../../hooks/appContext';
import { useActiveApi, useActiveWallet } from '../../../state/wallet';
import { useNotifyErrorHandle } from '../../../hooks/useNotification';
import { toNano } from '@ton/core';
import { assertBalanceEnough } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

export const useMinimalBalance = () => {
    const api = useActiveApi();
    const walletState = useActiveWallet();
    const notifyError = useNotifyErrorHandle();

    return useMutation(async () => {
        try {
            await assertBalanceEnough(api, toNano('0.01'), TON_ASSET, walletState.rawAddress);
        } catch (e) {
            await notifyError(e);
        }
    });
};
