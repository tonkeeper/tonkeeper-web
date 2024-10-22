import { useEstimationSender } from '../useSender';
import { useTonRawTransactionService } from '../useBlockchainService';
import { useActiveAccount } from '../../../state/wallet';
import { useQuery } from '@tanstack/react-query';
import { NFTEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/nft-encoder';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TransferEstimation } from '@tonkeeper/core/dist/entries/send';

export const useEstimateNftRenew = (args: { nftAddress: string }) => {
    const sender = useEstimationSender('external');
    const rawTransactionService = useTonRawTransactionService();
    const activeAccount = useActiveAccount();

    const walletAddress = activeAccount.activeTonWallet.rawAddress;

    return useQuery<TransferEstimation<TonAsset>, Error>(
        ['estimate-nft-renew', args.nftAddress, rawTransactionService, sender, walletAddress],
        async () => {
            const nftEncoder = new NFTEncoder(walletAddress);
            return rawTransactionService.estimate(sender!, nftEncoder.encodeNftRenew(args));
        },
        {
            enabled: !!sender
        }
    );
};
