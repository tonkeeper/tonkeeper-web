import { useTonRawTransactionService } from '../useBlockchainService';
import { useActiveAccount } from '../../../state/wallet';
import { useQuery } from '@tanstack/react-query';
import { NFTEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/nft-encoder';
import { EXTERNAL_SENDER_CHOICE, useGetEstimationSender } from '../useSender';
import { useToQueryKeyPart } from '../../useToQueryKeyPart';
import { TonEstimation } from '@tonkeeper/core/dist/entries/send';

export const useEstimateNftRenew = (args: { nftAddress: string }) => {
    const getSender = useGetEstimationSender(EXTERNAL_SENDER_CHOICE);
    const getSenderKey = useToQueryKeyPart(getSender);
    const rawTransactionService = useTonRawTransactionService();
    const activeAccount = useActiveAccount();

    const walletAddress = activeAccount.activeTonWallet.rawAddress;

    return useQuery<TonEstimation, Error>(
        ['estimate-nft-renew', args.nftAddress, rawTransactionService, getSenderKey, walletAddress],
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
