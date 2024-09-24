import { useMutation } from '@tanstack/react-query';
import { useAppContext } from '../../appContext';
import { useActiveMultisigWalletInfo } from '../../../state/multisig';
import { useAsyncQueryData } from '../../useAsyncQueryData';
import { MultisigConfig } from '@tonkeeper/core/dist/service/multisig/multisigService';
import { MultisigOrderLifetimeMinutes } from '../../../libs/multisig';
import { getServerTime } from '@tonkeeper/core/dist/service/transfer/common';
import { TransferEstimation } from '@tonkeeper/core/dist/entries/send';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { estimateNewOrder } from '@tonkeeper/core/dist/service/multisig/order/order-estimate';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

export function useEstimateChangeMultisigConfig() {
    const { api } = useAppContext();
    const { data: multisigInfoData } = useActiveMultisigWalletInfo();
    const multisigInfoPromise = useAsyncQueryData(multisigInfoData);

    return useMutation<
        TransferEstimation<TonAsset>,
        Error,
        {
            newConfig: Omit<MultisigConfig, 'allowArbitrarySeqno'>;
            ttlMinutes: MultisigOrderLifetimeMinutes;
        }
    >(async ({ ttlMinutes, newConfig }) => {
        const timestamp = await getServerTime(api);
        const multisig = await multisigInfoPromise;
        if (!multisig) {
            throw new Error('Multisig not found');
        }

        const payload = await estimateNewOrder({
            api,
            multisig,
            order: {
                actions: [
                    {
                        type: 'update',
                        ...newConfig
                    }
                ],
                validUntilSeconds: timestamp + Number(ttlMinutes) * 60
            }
        });

        return {
            fee: new AssetAmount({ weiAmount: payload.event.extra * -1, asset: TON_ASSET }),
            payload
        };
    });
}
