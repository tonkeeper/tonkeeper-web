import { TonAssetTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-asset-transaction.service';
import { useActiveAccount, useActiveApi } from '../../state/wallet';
import { useAppContext } from '../appContext';
import { useMemo } from 'react';
import { TonRawTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-raw-transaction.service';
import { TonConnectTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-connect-transaction.service';

export const useTonAssetTransferService = () => {
    const api = useActiveApi();
    const account = useActiveAccount();
    return useMemo(() => {
        return new TonAssetTransactionService(api, account.activeTonWallet);
    }, [api, account]);
};

export const useTonRawTransactionService = () => {
    const api = useActiveApi();
    const account = useActiveAccount();
    return useMemo(() => {
        return new TonRawTransactionService(api, account.activeTonWallet);
    }, [api, account]);
};

export const useTonConnectTransactionService = () => {
    const api = useActiveApi();
    const account = useActiveAccount();
    return useMemo(() => {
        return new TonConnectTransactionService(api, account.activeTonWallet);
    }, [api, account]);
};
