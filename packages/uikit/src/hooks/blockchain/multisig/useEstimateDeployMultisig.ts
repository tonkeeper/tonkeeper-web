import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useAccountsState, useActiveApi } from '../../../state/wallet';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { Address } from '@ton/core';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { useTonRawTransactionService } from '../useBlockchainService';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { MultisigConfig } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/multisig-encoder/types';
import { MultisigEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/multisig-encoder/multisig-encoder';
import { TwoFAMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender/two-fa-message-sender';
import { TwoFAWalletConfig, useTwoFAApi, useTwoFAServiceConfig } from '../../../state/two-fa';
import { useConfirmTwoFANotification } from '../../../components/modals/ConfirmTwoFANotificationControlled';
import { QueryKey } from '../../../libs/queryKey';
import { TransactionFee } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';

export const useEstimateDeployMultisig = () => {
    const accounts = useAccountsState();
    const rawTransactionService = useTonRawTransactionService();
    const api = useActiveApi();

    const queryClient = useQueryClient();
    const twoFaApi = useTwoFAApi();
    const { onOpen: openTwoFaConfirmTelegram, onClose: closeTwoFaConfirmTelegram } =
        useConfirmTwoFANotification();
    const twoFAServiceConfig = useTwoFAServiceConfig();

    return useMutation<
        { fee: TransactionFee; address: Address },
        Error,
        { multisigConfig: MultisigConfig; fromWallet: WalletId }
    >(async ({ multisigConfig, fromWallet }) => {
        const account = accounts
            .filter(isAccountTonWalletStandard)
            .find(a => a.allTonWallets.some(w => w.id === fromWallet));
        if (!account) {
            throw new Error('Wallet not found');
        }
        const walletState = account.allTonWallets.find(w => w.id === fromWallet);
        if (!walletState) {
            throw new Error('Wallet not found');
        }

        const multisigEncoder = new MultisigEncoder(api, walletState.rawAddress);

        const twoFaConfig = queryClient.getQueryData<TwoFAWalletConfig>([
            QueryKey.twoFAWalletConfig,
            walletState.id
        ]);

        let sender;
        if (twoFaConfig?.status === 'active') {
            sender = new TwoFAMessageSender(
                { tonApi: api, twoFaApi },
                walletState,
                estimationSigner,
                twoFaConfig.pluginAddress,
                {
                    openConfirmModal: () => {
                        openTwoFaConfirmTelegram();
                        return closeTwoFaConfirmTelegram;
                    },
                    confirmMessageTGTtlSeconds: twoFAServiceConfig.confirmMessageTGTtlSeconds
                }
            );
        } else {
            sender = new WalletMessageSender(api, walletState, estimationSigner);
        }

        const message = await multisigEncoder.encodeCreateMultisig(multisigConfig);

        const estimation = await rawTransactionService.estimate(sender, message);

        const address = new MultisigEncoder(api, walletState.rawAddress).multisigAddress(
            multisigConfig
        );

        return {
            fee: estimation.fee,
            address
        };
    });
};
