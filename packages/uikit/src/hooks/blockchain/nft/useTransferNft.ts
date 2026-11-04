import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import BigNumber from 'bignumber.js';

import { TonEstimation } from '@tonkeeper/core/dist/entries/send';
import { NFTEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/nft-encoder';
import { zeroFeeEstimation } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';

import { useGetSender } from '../useSender';
import { useTonRawTransactionService } from '../useBlockchainService';
import { useActiveAccount } from '../../../state/wallet';
import {
    toAnalyticsFeeAsset,
    useAnalyticsAssetId,
    useTrackTransactionSent
} from '../../analytics/events-hooks';
import { anyOfKeysParts, QueryKey } from '../../../libs/queryKey';
import {
    registerPendingActivity,
    schedulePostBroadcastRefresh
} from '../../../state/multichain/transfer/pendingActivity';
import {
    encodeNftTransfer,
    NftTransferFeeMethod,
    NftTransferParams
} from './useEstimateNftTransfer';

export interface NftTransferSendInput {
    method: NftTransferFeeMethod;
    estimation: TonEstimation;
}

/**
 * Sends an NFT from the active TON wallet, the fee paid with the picked
 * method: the wallet's own TON or Battery through the relayer. The attached
 * value is the transfer base plus the estimated network fee, so the NFT
 * contract receives enough to forward the item and return the excess.
 */
export const useTransferNft = (
    params: NftTransferParams | undefined,
    selected: NftTransferSendInput | undefined
) => {
    const getSender = useGetSender();
    const rawTransactionService = useTonRawTransactionService();
    const activeAccount = useActiveAccount();
    const trackTransactionSent = useTrackTransactionSent();
    const assetId = useAnalyticsAssetId();
    const client = useQueryClient();

    const walletAddress = activeAccount.activeTonWallet.rawAddress;

    return useMutation<boolean, Error>(async () => {
        if (!params || !selected) {
            throw new Error('NFT transfer is not ready');
        }
        const { method, estimation } = selected;
        const sender = await getSender(method);
        const nftTransferAmountWei = new BigNumber(NFTEncoder.nftTransferBase.toString()).plus(
            Math.abs(estimation.event?.extra ?? 0)
        );
        const external = await rawTransactionService.send(
            sender,
            zeroFeeEstimation,
            encodeNftTransfer(walletAddress, params, sender.excessAddress, nftTransferAmountWei)
        );

        trackTransactionSent({
            category: 'transfer',
            category_detail: 'nft',
            asset: assetId.tonNft(params.nftAddress),
            amount: 1,
            fee_asset: toAnalyticsFeeAsset(method.type)
        });

        if (activeAccount.type === 'multichain') {
            const nftRawAddress = Address.parse(params.nftAddress).toRawString();
            // Not awaited: the pending report must not delay the success
            // state. History refreshes once the report lands so the refetch
            // actually sees the pending row.
            void registerPendingActivity({
                credentials: multichainApiWalletCredentials(activeAccount),
                assetId: `ton/mainnet/nft/${nftRawAddress}`,
                txHash: external.hash().toString('hex'),
                activityType: 'send'
            }).then(() => client.invalidateQueries(anyOfKeysParts(QueryKey.multichainActivity)));
            schedulePostBroadcastRefresh(client);
        }
        await client.invalidateQueries(
            anyOfKeysParts(QueryKey.nft, QueryKey.multichainWalletAssets)
        );
        if (method.type === 'battery') {
            await client.invalidateQueries(anyOfKeysParts(QueryKey.batteryBalance));
        }
        return true;
    });
};
