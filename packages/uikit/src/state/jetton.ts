import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { updateWalletProperty } from '@tonkeeper/core/dist/service/walletService';
import {
    AccountsApi,
    JettonBalance,
    JettonInfo,
    JettonsApi,
    JettonsBalances
} from '@tonkeeper/core/dist/tonApiV2';
import { useMemo } from 'react';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useStorage } from '../hooks/storage';
import { JettonKey, QueryKey } from '../libs/queryKey';

export const useJettonInfo = (jettonAddress: string) => {
    const wallet = useWalletContext();
    const {
        api: { tonApiV2 }
    } = useAppContext();
    return useQuery<JettonInfo, Error>(
        [wallet.active.rawAddress, QueryKey.jettons, JettonKey.info, jettonAddress],
        async () => {
            const result = await new JettonsApi(tonApiV2).getJettonInfo({
                accountId: jettonAddress
            });
            return result;
        }
    );
};

export const useJettonBalance = (jettonAddress: string) => {
    const wallet = useWalletContext();
    const { api } = useAppContext();
    return useQuery<JettonBalance, Error>(
        [wallet.publicKey, QueryKey.jettons, JettonKey.balance, jettonAddress],
        async () => {
            const result = await new AccountsApi(api.tonApiV2).getAccountJettonsBalances({
                accountId: wallet.active.rawAddress
            });

            const balance = result.balances.find(item => item.jetton.address === jettonAddress);
            if (!balance) {
                throw new Error('Missing jetton balance');
            }
            return balance;
        }
    );
};

export const useToggleJettonMutation = () => {
    const storage = useStorage();
    const client = useQueryClient();
    const wallet = useWalletContext();

    return useMutation<void, Error, JettonBalance>(async jetton => {
        if (jetton.jetton.verification === 'whitelist') {
            const hiddenJettons = wallet.hiddenJettons ?? [];

            const updated = hiddenJettons.includes(jetton.jetton.address)
                ? hiddenJettons.filter(item => item !== jetton.jetton.address)
                : hiddenJettons.concat([jetton.jetton.address]);

            await updateWalletProperty(storage, wallet, {
                hiddenJettons: updated
            });
        } else {
            const shownJettons = wallet.shownJettons ?? [];

            const updated = shownJettons.includes(jetton.jetton.address)
                ? shownJettons.filter(item => item !== jetton.jetton.address)
                : shownJettons.concat([jetton.jetton.address]);

            await updateWalletProperty(storage, wallet, {
                shownJettons: updated
            });
        }

        await client.invalidateQueries([QueryKey.account]);
    });
};

export const sortJettons = (orderJettons: string[] | undefined, jettons: JettonBalance[]) => {
    if (!orderJettons) return jettons;
    return jettons.sort(
        (a, b) => orderJettons.indexOf(a.jetton.address) - orderJettons.indexOf(b.jetton.address)
    );
};

export const hideJettons = (
    hiddenJettons: string[] | undefined,
    shownJettons: string[] | undefined,
    jettons: JettonBalance[]
) => {
    return jettons.filter(jetton => {
        if (jetton.jetton.verification === 'whitelist') {
            return hiddenJettons ? !hiddenJettons.includes(jetton.jetton.address) : true;
        } else {
            return shownJettons ? shownJettons.includes(jetton.jetton.address) : false;
        }
    });
};

export const hideEmptyJettons = (jettons: JettonBalance[]) => {
    return jettons.filter(jetton => {
        return jetton.balance !== '0';
    });
};

export const filterTonAssetList = (jettons?: JettonsBalances, wallet?: WalletState) => {
    if (!jettons) return { balances: [] };
    const order = sortJettons(wallet?.orderJettons, jettons.balances);
    const hide = hideJettons(wallet?.hiddenJettons, wallet?.shownJettons, order);
    const notEmpty = hideEmptyJettons(hide);

    return {
        balances: notEmpty
    };
};

export const useUserJettonList = (jettons?: JettonsBalances) => {
    const { hiddenJettons, orderJettons, shownJettons } = useWalletContext();

    return useMemo<JettonsBalances>(() => {
        if (!jettons) return { balances: [] };
        const order = sortJettons(orderJettons, jettons.balances);
        const hide = hideJettons(hiddenJettons, shownJettons, order);
        const notEmpty = hideEmptyJettons(hide);

        return {
            balances: notEmpty
        };
    }, [jettons, hiddenJettons, orderJettons]);
};
