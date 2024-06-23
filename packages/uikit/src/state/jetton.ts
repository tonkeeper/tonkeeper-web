import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { ActiveWalletConfig } from '@tonkeeper/core/dist/entries/wallet';
import {
    getActiveWalletConfig,
    setActiveWalletConfig
} from '@tonkeeper/core/dist/service/wallet/configService';
import {
    AccountsApi,
    JettonBalance,
    JettonInfo,
    JettonsApi,
    JettonsBalances
} from '@tonkeeper/core/dist/tonApiV2';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
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
    const sdk = useAppSdk();

    return useQuery<JettonsBalances, Error>(
        [wallet.active.rawAddress, JettonKey.raw, QueryKey.jettons, fiat, wallet.network],
        async () => {
            const result = await new AccountsApi(api.tonApiV2).getAccountJettonsBalances({
                accountId: wallet.active.rawAddress,
                currencies: [fiat]
            });
            const balances = filterTokens(result.balances, []).sort(compareTokensOver(fiat));
            return { balances };
        }
    );
};

export const useJettonList = () => {
    const wallet = useWalletContext();
    const { api, fiat } = useAppContext();
    const client = useQueryClient();
    const sdk = useAppSdk();

    return useQuery<JettonsBalances, Error>(
        [wallet.active.rawAddress, QueryKey.jettons, fiat, wallet.network],
        async () => {
            const result = await new AccountsApi(api.tonApiV2).getAccountJettonsBalances({
                accountId: wallet.active.rawAddress,
                currencies: [fiat]
            });

            const config = await getActiveWalletConfig(
                sdk.storage,
                wallet.active.rawAddress,
                wallet.network
            );

            const balances = filterTokens(result.balances, config.hiddenTokens).sort(
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

            const pinned = config.pinnedTokens.reduce((acc, address) => {
                const item = balances.find(item => item.jetton.address === address);
                if (item) {
                    acc.push(item);
                }
                return acc;
            }, [] as JettonBalance[]);

            const rest = balances.filter(
                item => !config.pinnedTokens.includes(item.jetton.address)
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

export const useActiveWalletConfig = () => {
    const wallet = useWalletContext();
    const sdk = useAppSdk();
    return useQuery<ActiveWalletConfig, Error>(
        [wallet.active.rawAddress, wallet.network, QueryKey.walletConfig],
        async () => getActiveWalletConfig(sdk.storage, wallet.active.rawAddress, wallet.network)
    );
};

export const useTogglePinJettonMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const wallet = useWalletContext();

    return useMutation<void, Error, { config: ActiveWalletConfig; jetton: JettonBalance }>(
        async ({ config, jetton }) => {
            const pinnedTokens = config.pinnedTokens.includes(jetton.jetton.address)
                ? config.pinnedTokens.filter(item => item !== jetton.jetton.address)
                : config.pinnedTokens.concat([jetton.jetton.address]);

            const newConfig = {
                ...config,
                pinnedTokens
            };

            client.setQueryData(
                [wallet.active.rawAddress, wallet.network, QueryKey.walletConfig],
                newConfig
            );

            await setActiveWalletConfig(
                sdk.storage,
                wallet.active.rawAddress,
                wallet.network,
                newConfig
            );

            await client.invalidateQueries([wallet.active.rawAddress, QueryKey.jettons]);
        }
    );
};

export const useSavePinnedJettonOrderMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const wallet = useWalletContext();

    return useMutation<void, Error, { config: ActiveWalletConfig; pinnedTokens: string[] }>(
        async ({ config, pinnedTokens }) => {
            const newConfig = { ...config, pinnedTokens };
            client.setQueryData(
                [wallet.active.rawAddress, wallet.network, QueryKey.walletConfig],
                newConfig
            );

            await setActiveWalletConfig(
                sdk.storage,
                wallet.active.rawAddress,
                wallet.network,
                newConfig
            );
            await client.invalidateQueries([wallet.active.rawAddress, QueryKey.jettons]);
        }
    );
};

export const useToggleHideJettonMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const wallet = useWalletContext();

    return useMutation<void, Error, { config: ActiveWalletConfig; jetton: JettonBalance }>(
        async ({ config, jetton }) => {
            let newConfig: ActiveWalletConfig;

            if (config.hiddenTokens.includes(jetton.jetton.address)) {
                const hiddenTokens = config.hiddenTokens.filter(
                    item => item !== jetton.jetton.address
                );
                newConfig = {
                    ...config,
                    hiddenTokens
                };
            } else {
                const hiddenTokens = config.hiddenTokens.concat([jetton.jetton.address]);
                const pinnedTokens = config.pinnedTokens.filter(
                    item => item !== jetton.jetton.address
                );
                newConfig = {
                    ...config,
                    hiddenTokens,
                    pinnedTokens
                };
            }

            client.setQueryData(
                [wallet.active.rawAddress, wallet.network, QueryKey.walletConfig],
                newConfig
            );

            await setActiveWalletConfig(
                sdk.storage,
                wallet.active.rawAddress,
                wallet.network,
                newConfig
            );

            await client.invalidateQueries([wallet.active.rawAddress, QueryKey.jettons]);
        }
    );
};
