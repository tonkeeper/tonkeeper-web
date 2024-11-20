import { useMutation } from '@tanstack/react-query';
import { useAppContext } from '../../appContext';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useAccountsState } from '../../../state/wallet';
import {
    getNetworkByAccount,
    isAccountTonWalletStandard
} from '@tonkeeper/core/dist/entries/account';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { Address } from '@ton/core';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { useTonRawTransactionService } from '../useBlockchainService';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { MultisigConfig } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/multisig-encoder/types';
import { MultisigEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/multisig-encoder/multisig-encoder';
import { getContextApiByNetwork } from '@tonkeeper/core/dist/service/walletService';

export const useEstimateDeployMultisig = () => {
    const appContext = useAppContext();
    const accounts = useAccountsState();
    const rawTransactionService = useTonRawTransactionService();

    return useMutation<
        { extra: AssetAmount; address: Address },
        Error,
        { multisigConfig: MultisigConfig; fromWallet: WalletId }
    >(async ({ multisigConfig, fromWallet }) => {
        const account = accounts
            .filter(isAccountTonWalletStandard)
            .find(account => account.allTonWallets.some(w => w.id === fromWallet));
        if (!account) {
            throw new Error('Wallet not found');
        }
        const walletState = account.allTonWallets.find(w => w.id === fromWallet);
        if (!walletState) {
            throw new Error('Wallet not found');
        }

        const [api] = getContextApiByNetwork(appContext, getNetworkByAccount(account));

        const multisigEncoder = new MultisigEncoder(api, walletState.rawAddress);
        const sender = new WalletMessageSender(api, walletState, estimationSigner);

        const message = await multisigEncoder.encodeCreateMultisig(multisigConfig);

        const estimation = await rawTransactionService.estimate(sender, message);

        const address = new MultisigEncoder(api, walletState.rawAddress).multisigAddress(
            multisigConfig
        );

        return {
            extra: estimation.extra,
            address
        };
    });
};
