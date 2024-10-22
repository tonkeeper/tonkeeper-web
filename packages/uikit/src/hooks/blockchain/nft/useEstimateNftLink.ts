import { useQuery } from '@tanstack/react-query';
import { useGetEstimationSender } from '../useSender';
import { useTonRawTransactionService } from '../useBlockchainService';
import { NFTEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/nft-encoder';
import { useActiveAccount } from '../../../state/wallet';
import { TransferEstimation } from '@tonkeeper/core/dist/entries/send';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';

export const useEstimateNftLink = (args: { nftAddress: string; linkToAddress: string }) => {
    const getSender = useGetEstimationSender('external');
    const rawTransactionService = useTonRawTransactionService();
    const activeAccount = useActiveAccount();

    const walletAddress = activeAccount.activeTonWallet.rawAddress;

    return useQuery<TransferEstimation<TonAsset>, Error>(
        [
            'estimate-link-nft',
            args.nftAddress,
            args.linkToAddress,
            rawTransactionService,
            getSender,
            walletAddress
        ],
        async () => {
            const nftEncoder = new NFTEncoder(walletAddress);
            return rawTransactionService.estimate(
                await getSender!(),
                nftEncoder.encodeNftLink(args)
            );
        },
        {
            enabled: !!getSender
        }
    );
};
