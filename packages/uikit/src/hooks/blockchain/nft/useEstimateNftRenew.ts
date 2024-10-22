import { useTonRawTransactionService } from '../useBlockchainService';
import { useActiveAccount } from '../../../state/wallet';
import { useQuery } from '@tanstack/react-query';
import { NFTEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/nft-encoder';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TransferEstimation } from '@tonkeeper/core/dist/entries/send';
import { useGetEstimationSender } from '../useSender';

export const useEstimateNftRenew = (args: { nftAddress: string }) => {
    const getSender = useGetEstimationSender('external');
    const rawTransactionService = useTonRawTransactionService();
    const activeAccount = useActiveAccount();

    const walletAddress = activeAccount.activeTonWallet.rawAddress;

    return useQuery<TransferEstimation<TonAsset>, Error>(
        ['estimate-nft-renew', args.nftAddress, rawTransactionService, getSender, walletAddress],
        async () => {
            const nftEncoder = new NFTEncoder(walletAddress);
            return rawTransactionService.estimate(
                await getSender!(),
                nftEncoder.encodeNftRenew(args)
            );
        },
        {
            enabled: !!getSender
        }
    );
};
