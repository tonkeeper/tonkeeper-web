import { TonAssetTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-asset-transaction.service';
import { useActiveAccount } from '../../state/wallet';
import { useAppContext } from '../appContext';
import { useMemo } from 'react';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';

export const useTransferService = () => {
    const { api } = useAppContext();
    const account = useActiveAccount();
    return useMemo(() => {
        if (!isAccountTonWalletStandard(account)) {
            throw new Error("Can't send a transfer using this account");
        }

        return new TonAssetTransactionService(api, account.activeTonWallet);
    }, [api, account]);
};
