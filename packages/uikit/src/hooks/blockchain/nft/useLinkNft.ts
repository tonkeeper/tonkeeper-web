import { EXTERNAL_SENDER_CHOICE, useGetSender } from '../useSender';
import { useTonRawTransactionService } from '../useBlockchainService';
import { useActiveAccount } from '../../../state/wallet';
import { useMutation } from '@tanstack/react-query';
import { NFTEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/nft-encoder';
import { zeroFeeEstimation } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { useTrackTransactionSent } from '../../analytics/events-hooks';

export const useLinkNft = (args: { nftAddress: string; linkToAddress: string }) => {
    const getSender = useGetSender();
    const rawTransactionService = useTonRawTransactionService();
    const activeAccount = useActiveAccount();
    const trackTransactionSent = useTrackTransactionSent();

    const walletAddress = activeAccount.activeTonWallet.rawAddress;

    return useMutation<boolean, Error>(async () => {
        const nftEncoder = new NFTEncoder(walletAddress);
        await rawTransactionService.send(
            await getSender(EXTERNAL_SENDER_CHOICE),
            zeroFeeEstimation,
            nftEncoder.encodeNftLink(args)
        );
        trackTransactionSent('DomainRenew');
        return true;
    });
};
