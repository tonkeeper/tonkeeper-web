import { EXTERNAL_SENDER_CHOICE, TWO_FA_SENDER_CHOICE, useGetSender } from '../useSender';
import { useTonRawTransactionService } from '../useBlockchainService';
import { useActiveAccount } from '../../../state/wallet';
import { useTransactionAnalytics } from '../../amplitude';
import { useMutation } from '@tanstack/react-query';
import { NFTEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/nft-encoder';
import { zeroFee } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { useTwoFAWalletConfig } from '../../../state/two-fa';

export const useRenewNft = (args: { nftAddress: string }) => {
    const { data: twoFaConfig } = useTwoFAWalletConfig();
    const getSender = useGetSender();
    const rawTransactionService = useTonRawTransactionService();
    const activeAccount = useActiveAccount();
    const track2 = useTransactionAnalytics();

    const walletAddress = activeAccount.activeTonWallet.rawAddress;

    return useMutation<boolean, Error>(async () => {
        const nftEncoder = new NFTEncoder(walletAddress);
        await rawTransactionService.send(
            await getSender(
                twoFaConfig?.status === 'active' ? TWO_FA_SENDER_CHOICE : EXTERNAL_SENDER_CHOICE
            ),
            zeroFee,
            nftEncoder.encodeNftRenew(args)
        );
        track2('renew-dns');
        return true;
    });
};
