import { EXTERNAL_SENDER_CHOICE, useGetSender } from '../useSender';
import { useTonRawTransactionService } from '../useBlockchainService';
import { useActiveAccount } from '../../../state/wallet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { anyOfKeysParts, QueryKey } from '../../../libs/queryKey';
import { schedulePostBroadcastRefresh } from '../../../state/multichain/transfer/pendingActivity';
import { NFTEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/nft-encoder';
import { zeroFeeEstimation } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { useAnalyticsAssetId, useTrackTransactionSent } from '../../analytics/events-hooks';

export const useLinkNft = (args: { nftAddress: string; linkToAddress: string }) => {
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
            nftEncoder.encodeNftLink(args)
        );
        // Linking a domain to an address isn't a renewal, a subscription, a
        // multisig op or a deploy — `unknown` is the only honest detail.
        trackTransactionSent({
            category: 'call',
            category_detail: 'unknown',
            asset: assetId.tonCoin(),
            amount: 0,
            fee_asset: 'coin'
        });
        if (activeAccount.type === 'multichain') {
            await client.invalidateQueries(
                anyOfKeysParts(QueryKey.multichainActivity, QueryKey.multichainWalletAssets)
            );
            schedulePostBroadcastRefresh(client);
        }
        return true;
    });
};
