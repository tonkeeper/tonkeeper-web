import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { useAppContext } from '../hooks/appContext';
import { MultisigApi } from '@tonkeeper/core/dist/tonApiV2';
import { useActiveAccount } from './wallet';

export const useMultisigWalletInfo = (walletAddressRaw: string) => {
    const { api } = useAppContext();
    return useQuery([QueryKey.multisigWallet, walletAddressRaw, api], async () => {
        const multisigApi = new MultisigApi(api.tonApiV2);
        return multisigApi.getMultisigAccount({ accountId: walletAddressRaw });
    });
};

export const useActiveMultisigWalletInfo = () => {
    const { api } = useAppContext();
    const account = useActiveAccount();

    if (account.type !== 'ton-multisig') {
        throw new Error('Not multisig account');
    }

    return useMultisigWalletInfo(account.id);
};
