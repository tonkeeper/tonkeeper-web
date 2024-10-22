import { useQuery } from '@tanstack/react-query';
import { useEstimationSender } from '../useSender';
import { useTonRawTransactionService } from '../useBlockchainService';
import { NFTEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/nft-encoder';
import { useActiveAccount } from '../../../state/wallet';
import { TransferEstimation } from '@tonkeeper/core/dist/entries/send';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';

export const useEstimateNftLink = (args: { nftAddress: string; linkToAddress: string }) => {
    const sender = useEstimationSender('external');
    const rawTransactionService = useTonRawTransactionService();
    const activeAccount = useActiveAccount();

    const walletAddress = activeAccount.activeTonWallet.rawAddress;

    return useQuery<TransferEstimation<TonAsset>, Error>(
        [
            'estimate-link-nft',
            args.nftAddress,
            args.linkToAddress,
            rawTransactionService,
            sender,
            walletAddress
        ],
        async () => {
            const nftEncoder = new NFTEncoder(walletAddress);
            return rawTransactionService.estimate(sender!, nftEncoder.encodeNftLink(args));
        },
        {
            enabled: !!sender
        }
    );
};
