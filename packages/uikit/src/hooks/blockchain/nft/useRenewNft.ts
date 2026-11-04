import { EXTERNAL_SENDER_CHOICE, useGetSender } from '../useSender';
import { useTonRawTransactionService } from '../useBlockchainService';
import { useActiveAccount } from '../../../state/wallet';
import { useAnalyticsAssetId, useTrackTransactionSent } from '../../analytics/events-hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { anyOfKeysParts, QueryKey } from '../../../libs/queryKey';
import { schedulePostBroadcastRefresh } from '../../../state/multichain/transfer/pendingActivity';
import { NFTEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/nft-encoder';
import { zeroFeeEstimation } from '@tonkeeper/core/dist/service/ton-blockchain/utils';

export const useRenewNft = (args: { nftAddress: string }) => {
    const getSender = useGetSender();
    const rawTransactionService = useTonRawTransactionService();
    const activeAccount = useActiveAccount();
    const trackTransactionSent = useTrackTransactionSent();
    const assetId = useAnalyticsAssetId();
    const client = useQueryClient();

    const walletAddress = activeAccount.activeTonWallet.rawAddress;

    return useMutation<boolean, Error>(async () => {
        const nftEncoder = new NFTEncoder(walletAddress);
        await rawTransactionService.send(
            await getSender(EXTERNAL_SENDER_CHOICE),
            zeroFeeEstimation,
            nftEncoder.encodeNftRenew(args)
        );
        trackTransactionSent({
            category: 'call',
            category_detail: 'domain_renew',
            asset: assetId.tonCoin(),
            amount: 0,
            fee_asset: 'coin'
        });
        // The multichain feed only learns about the renewal once the indexer
        // classifies it, so the immediate invalidation alone would refetch a
        // feed without the row — the refresh ladder catches the late arrival.
        if (activeAccount.type === 'multichain') {
            await client.invalidateQueries(
                anyOfKeysParts(QueryKey.multichainActivity, QueryKey.multichainWalletAssets)
            );
            schedulePostBroadcastRefresh(client);
        }
        return true;
    });
};
