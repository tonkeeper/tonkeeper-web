import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { updateWalletProperty } from '@tonkeeper/core/dist/service/walletService';
import {
    AccountsApi,
    JettonBalance,
    JettonInfo,
    JettonsApi,
    JettonsBalances
} from '@tonkeeper/core/dist/tonApiV2';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useStorage } from '../hooks/storage';
import { JettonKey, QueryKey } from '../libs/queryKey';
import { getRateKey, toTokenRate } from './rates';
import { DefaultRefetchInterval } from './tonendpoint';

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

const filterTokens = (balances: JettonBalance[], hiddenTokens: string[]) => {
    return balances.filter(
        item =>
            item.jetton.verification !== 'blacklist' &&
            new BigNumber(item.balance).gt(0) &&
            !hiddenTokens.includes(item.jetton.address)
    );
};

const getTokenBalance = ({ price, balance, jetton }: JettonBalance, fiat: FiatCurrencies) => {
    if (!price || !price.prices || !price.prices[fiat]) return new BigNumber(0);
    const p = price.prices[fiat];
    return shiftedDecimals(balance, jetton.decimals).multipliedBy(p);
};

const compareTokensOver = (fiat: FiatCurrencies) => {
    return (a: JettonBalance, b: JettonBalance) => {
        return getTokenBalance(b, fiat).minus(getTokenBalance(a, fiat)).toNumber();
    };
};

export const useJettonRawList = () => {
    const wallet = useWalletContext();
    const { api, fiat } = useAppContext();

    return useQuery<JettonsBalances, Error>(
        [wallet.active.rawAddress, JettonKey.raw, QueryKey.jettons, fiat, wallet.network],
        async () => {
            const result = await new AccountsApi(api.tonApiV2).getAccountJettonsBalances({
                accountId: wallet.active.rawAddress,
                currencies: [fiat]
            });
            const balances = filterTokens(result.balances, wallet.hiddenTokens ?? []).sort(
                compareTokensOver(fiat)
            );
            return { balances };
        }
    );
};

export const useJettonList = () => {
    const wallet = useWalletContext();
    const { api, fiat } = useAppContext();
    const client = useQueryClient();

    return useQuery<JettonsBalances, Error>(
        [wallet.active.rawAddress, QueryKey.jettons, fiat, wallet.network],
        async () => {
            const result = await new AccountsApi(api.tonApiV2).getAccountJettonsBalances({
                accountId: wallet.active.rawAddress,
                currencies: [fiat]
            });

            const balances = filterTokens(result.balances, wallet.hiddenTokens ?? []).sort(
                compareTokensOver(fiat)
            );

            result.balances.forEach(item => {
                client.setQueryData(
                    [wallet.publicKey, QueryKey.jettons, JettonKey.balance, item.jetton.address],
                    item
                );

                if (item.price) {
                    try {
                        const tokenRate = toTokenRate(item.price, fiat);
                        client.setQueryData(
                            getRateKey(fiat, Address.parse(item.jetton.address).toString()),
                            tokenRate
                        );
                    } catch (e) {
                        console.error(e);
                    }
                }
            });

            const pinned = (wallet.pinnedTokens ?? []).reduce((acc, address) => {
                const item = balances.find(item => item.jetton.address === address);
                if (item) {
                    acc.push(item);
                }
                return acc;
            }, [] as JettonBalance[]);

            const rest = balances.filter(
                item => !(wallet.pinnedTokens ?? []).includes(item.jetton.address)
            );
            return { balances: pinned.concat(rest) };
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchIntervalInBackground: true,
            refetchOnWindowFocus: true,
            keepPreviousData: true
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
