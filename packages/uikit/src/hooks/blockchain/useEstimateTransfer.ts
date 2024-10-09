import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    RecipientData,
    TonRecipientData,
    TransferEstimation
} from '@tonkeeper/core/dist/entries/send';
import { notifyError } from '../../components/transfer/common';
import { QueryKey } from '../../libs/queryKey';
import { DefaultRefetchInterval } from '../../state/tonendpoint';
import { useAppContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';
import { useActiveStandardTonWallet } from '../../state/wallet';
import { TonAssetTransferService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-asset-transfer-service';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender/wallet-message-sender';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';

export function useEstimateTransfer(
    recipient: RecipientData,
    amount: AssetAmount<TonAsset>,
    isMax: boolean
) {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const wallet = useActiveStandardTonWallet();
    const client = useQueryClient();

    return useQuery<TransferEstimation<TonAsset>, Error>(
        [QueryKey.estimate, recipient, amount],
        async () => {
            try {
                if (isTonAsset(amount.asset)) {
                    const sender = new WalletMessageSender(api, wallet, estimationSigner);
                    const transferService = new TonAssetTransferService(api, wallet);

                    return await transferService.estimate(sender, {
                        to: recipient.address.address,
                        amount: amount as AssetAmount<TonAsset>,
                        isMax,
                        comment: (recipient as TonRecipientData).comment
                    });
                } else {
                    throw new Error('Tron is not supported');
                }
            } catch (e) {
                await notifyError(client, sdk, t, e);
                throw e;
            }
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchOnMount: 'always'
        }
    );
}
