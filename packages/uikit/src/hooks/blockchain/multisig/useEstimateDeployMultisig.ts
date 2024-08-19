import { useMutation } from '@tanstack/react-query';
import {
    estimateDeployMultisig,
    MultisigConfig
} from '@tonkeeper/core/dist/service/multisigService';
import { useAppContext } from '../../appContext';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useAccountsState } from '../../../state/wallet';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { TransferEstimationEvent } from '@tonkeeper/core/dist/entries/send';

export const useEstimateDeployMultisig = () => {
    const { api } = useAppContext();
    const wallets = useAccountsState()
        .filter(isAccountTonWalletStandard)
        .flatMap(a => a.allTonWallets);
    return useMutation<
        TransferEstimationEvent,
        Error,
        { multisigConfig: MultisigConfig; fromWallet: WalletId }
    >(({ multisigConfig, fromWallet }) => {
        const walletState = wallets.find(w => w.id === fromWallet);
        if (!walletState) {
            throw new Error('Wallet not found');
        }

        return estimateDeployMultisig({ api, multisigConfig, walletState });
    });
};
