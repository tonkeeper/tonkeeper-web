import { useMutation, useQuery } from '@tanstack/react-query';
import { useAppContext } from '../appContext';
import { useGetActiveAccountSigner } from '../../state/mnemonic';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { TonAssetTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-asset-transaction.service';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { TransferEstimation } from '@tonkeeper/core/dist/entries/send';
import { isTon, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { useBatteryApi } from '../../state/battery';
import {
    useActiveAccount,
    useActiveStandardTonWallet,
    useInvalidateActiveWalletQueries
} from '../../state/wallet';
import { QueryKey } from '../../libs/queryKey';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { DefaultRefetchInterval } from '../../state/tonendpoint';
import { useNotifyErrorHandle } from '../useNotification';

export function useEstimatePurchaseBattery(assetAmount: AssetAmount<TonAsset>) {
    const { api } = useAppContext();
    const wallet = useActiveStandardTonWallet();
    const batteryApi = useBatteryApi();
    const notifyError = useNotifyErrorHandle();

    return useQuery<TransferEstimation<TonAsset>, Error>(
        [QueryKey.estimateBatteryPurchase, assetAmount, batteryApi, wallet],
        async () => {
            try {
                const batteryConfig = await batteryApi.default.getConfig();

                if ('error' in batteryConfig) {
                    throw new Error(batteryConfig.error);
                }

                if (isTon(assetAmount.asset.address)) {
                    const transferService = new TonAssetTransactionService(api, wallet);
                    const sender = new WalletMessageSender(api, wallet, estimationSigner);
                    return await transferService.estimate(sender, {
                        to: batteryConfig.fund_receiver,
                        amount: assetAmount,
                        isMax: false
                    });
                } else {
                    throw new Error('Not yet implemented');
                }
            } catch (e) {
                await notifyError(e);
                throw e;
            }
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchOnMount: 'always'
        }
    );
}

export const usePurchaseBattery = ({
    estimation,
    assetAmount
}: {
    estimation: TransferEstimation<TonAsset>;
    assetAmount: AssetAmount<TonAsset>;
}) => {
    const getSigner = useGetActiveAccountSigner();
    const batteryApi = useBatteryApi();
    const account = useActiveAccount();
    const { api } = useAppContext();
    const notifyError = useNotifyErrorHandle();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();

    return useMutation<boolean, Error>(async () => {
        const signer = await getSigner();
        if (signer === null) return false;
        try {
            if (!isAccountTonWalletStandard(account) || signer.type === 'ledger') {
                throw new Error("Can't send a transfer using this account");
            }

            const batteryConfig = await batteryApi.default.getConfig();

            if ('error' in batteryConfig) {
                throw new Error(batteryConfig.error);
            }

            if (isTon(assetAmount.asset.address)) {
                const transferService = new TonAssetTransactionService(
                    api,
                    account.activeTonWallet
                );
                const sender = new WalletMessageSender(api, account.activeTonWallet, signer);
                await transferService.send(sender, estimation, {
                    to: batteryConfig.fund_receiver,
                    amount: assetAmount,
                    isMax: false
                });
            } else {
                throw new Error('Not yet implemented');
            }
        } catch (e) {
            await notifyError(e);
        }

        await invalidateAccountQueries();
        return true;
    });
};
