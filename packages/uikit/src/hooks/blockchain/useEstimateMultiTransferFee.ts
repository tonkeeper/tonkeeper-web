import { useMutation } from '@tanstack/react-query';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';

import { AccountEvent } from '@tonkeeper/core/dist/tonApiV2';
import { MultiSendFormTokenized, multiSendFormToTransferMessages } from './useSendMultiTransfer';
import { useNotifyErrorHandle } from '../useNotification';
import { useGetSender } from './useSender';
import { useTonAssetTransferService } from './useBlockchainService';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { useActiveAccount } from '../../state/wallet';

export function useEstimateMultiTransfer() {
    const notifyError = useNotifyErrorHandle();
    const getSender = useGetSender('external');
    const transferService = useTonAssetTransferService();
    const account = useActiveAccount();

    return useMutation<
        { fee: AssetAmount<TonAsset>; estimation: AccountEvent },
        Error,
        { form: MultiSendFormTokenized; asset: TonAsset }
    >(async ({ form, asset }) => {
        try {
            if (!isAccountTonWalletStandard(account)) {
                throw new Error("Can't send a transfer using this account");
            }

            if (account.type === 'ledger') {
                throw new Error("Can't estimate fee using ledger account");
            }

            const result = await transferService.estimate(
                await getSender(),
                multiSendFormToTransferMessages(asset, form)
            );

            return {
                fee: result.fee,
                estimation: result.payload.event
            };
        } catch (e) {
            await notifyError(e);
            throw e;
        }
    });
}
