import { useQuery } from '@tanstack/react-query';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';

import { MultiSendFormTokenized, multiSendFormToTransferMessages } from './useSendMultiTransfer';
import { useNotifyErrorHandle } from '../useNotification';
import { EXTERNAL_SENDER_CHOICE, useGetEstimationSender } from './useSender';
import { useTonAssetTransferService } from './useBlockchainService';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { useActiveAccount } from '../../state/wallet';
import { TonEstimation } from '@tonkeeper/core/dist/entries/send';

export function useEstimateMultiTransfer(form: MultiSendFormTokenized, asset: TonAsset) {
    const notifyError = useNotifyErrorHandle();
    const getSender = useGetEstimationSender(EXTERNAL_SENDER_CHOICE);
    const transferService = useTonAssetTransferService();
    const account = useActiveAccount();

    return useQuery<TonEstimation, Error>(
        ['multi-transfer-estimate'],
        async () => {
            try {
                if (!isAccountTonWalletStandard(account)) {
                    throw new Error("Can't send a transfer using this account");
                }

                if (account.type === 'ledger') {
                    throw new Error("Can't estimate fee using ledger account");
                }

                return await transferService.estimate(
                    await getSender!(),
                    multiSendFormToTransferMessages(asset, form)
                );
            } catch (e) {
                await notifyError(e);
                throw e;
            }
        },
        {
            enabled: !!getSender,
            refetchOnMount: 'always'
        }
    );
}
