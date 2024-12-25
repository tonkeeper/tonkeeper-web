import { useQuery } from '@tanstack/react-query';
import { EXTERNAL_SENDER_CHOICE, TWO_FA_SENDER_CHOICE, useGetEstimationSender } from '../useSender';
import { useTonRawTransactionService } from '../useBlockchainService';
import { NFTEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/nft-encoder';
import { useActiveAccount } from '../../../state/wallet';
import { useToQueryKeyPart } from '../../useToQueryKeyPart';
import { TonEstimation } from '@tonkeeper/core/dist/entries/send';
import { useTwoFAWalletConfig } from '../../../state/two-fa';

export const useEstimateNftLink = (args: { nftAddress: string; linkToAddress: string }) => {
    const { data: twoFaConfig } = useTwoFAWalletConfig();
    const getSender = useGetEstimationSender(
        twoFaConfig?.status === 'active' ? TWO_FA_SENDER_CHOICE : EXTERNAL_SENDER_CHOICE
    );
    const getSenderKey = useToQueryKeyPart(getSender);
    const rawTransactionService = useTonRawTransactionService();
    const activeAccount = useActiveAccount();

    const walletAddress = activeAccount.activeTonWallet.rawAddress;

    return useQuery<TonEstimation, Error>(
        [
            'estimate-link-nft',
            args.nftAddress,
            args.linkToAddress,
            rawTransactionService,
            getSenderKey,
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
