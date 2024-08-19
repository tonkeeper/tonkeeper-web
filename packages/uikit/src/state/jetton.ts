import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { TonWalletConfig } from '@tonkeeper/core/dist/entries/wallet';
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
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { JettonKey, QueryKey } from '../libs/queryKey';
import { useActiveTonNetwork, useActiveWallet } from './wallet';

export const useJettonInfo = (jettonAddress: string) => {
    const wallet = useActiveWallet();
    const {
        api: { tonApiV2 }
    } = useAppContext();
    return useQuery<JettonInfo, Error>(
        [wallet.id, QueryKey.jettons, JettonKey.info, jettonAddress],
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
    const wallet = useActiveWallet();
    const network = useActiveTonNetwork();
    const { api, fiat } = useAppContext();

    return useQuery<JettonsBalances, Error>(
        [wallet.id, JettonKey.raw, QueryKey.jettons, fiat, network],
        async () => {
            const result = await new AccountsApi(api.tonApiV2).getAccountJettonsBalances({
                accountId: wallet.rawAddress,
                currencies: [fiat],
                supportedExtensions: ['custom_payload']
            });
            const balances = filterTokens(result.balances, []).sort(compareTokensOver(fiat));
            return { balances };
        }
    );
};

export const useJettonList = () => {
    const wallet = useActiveWallet();
    const network = useActiveTonNetwork();
    const { api, fiat } = useAppContext();
    const sdk = useAppSdk();

    return useQuery<JettonsBalances, Error>(
        [wallet.id, QueryKey.jettons, fiat, network],
        async () => {
            const result = await new AccountsApi(api.tonApiV2).getAccountJettonsBalances({
                accountId: wallet.rawAddress,
                currencies: [fiat],
                supportedExtensions: ['custom_payload']
            });

            const config = await getActiveWalletConfig(sdk.storage, wallet.rawAddress, network);

            const balances = filterTokens(result.balances, config.hiddenTokens).sort(
                compareTokensOver(fiat)
            );

            const pinned = config.pinnedTokens.reduce((acc, address) => {
                const item = balances.find(i => i.jetton.address === address);
                if (item) {
                    acc.push(item);
                }
                return acc;
            }, [] as JettonBalance[]);

            const rest = balances.filter(
                item => !config.pinnedTokens.includes(item.jetton.address)
            );
            return { balances: pinned.concat(rest) };
        }
    );
};

export const useJettonBalance = (jettonAddress: string) => {
    const wallet = useActiveWallet();
    const { api } = useAppContext();
    return useQuery<JettonBalance, Error>(
        [wallet.id, QueryKey.jettons, JettonKey.balance, jettonAddress],
        async () => {
            const result = await new AccountsApi(api.tonApiV2).getAccountJettonBalance({
                accountId: wallet.rawAddress,
                jettonId: jettonAddress
            });
            return result;
        }
    );
};

export const useTogglePinJettonMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const wallet = useActiveWallet();
    const network = useActiveTonNetwork();

    return useMutation<void, Error, { config: TonWalletConfig; jetton: JettonBalance }>(
        async ({ config, jetton }) => {
            const pinnedTokens = config.pinnedTokens.includes(jetton.jetton.address)
                ? config.pinnedTokens.filter(item => item !== jetton.jetton.address)
                : config.pinnedTokens.concat([jetton.jetton.address]);

            const newConfig = {
                ...config,
                pinnedTokens
            };

            client.setQueryData([wallet.id, network, QueryKey.walletConfig], newConfig);

            await setActiveWalletConfig(sdk.storage, wallet.rawAddress, network, newConfig);

            await client.invalidateQueries([wallet.id, QueryKey.jettons]);
        }
    );
};

export const useSavePinnedJettonOrderMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const wallet = useActiveWallet();
    const network = useActiveTonNetwork();

    return useMutation<void, Error, { config: TonWalletConfig; pinnedTokens: string[] }>(
        async ({ config, pinnedTokens }) => {
            const newConfig = { ...config, pinnedTokens };
            client.setQueryData([wallet.id, network, QueryKey.walletConfig], newConfig);

            await setActiveWalletConfig(sdk.storage, wallet.rawAddress, network, newConfig);
            await client.invalidateQueries([wallet.id, QueryKey.jettons]);
        }
    );
};

export const useToggleHideJettonMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const wallet = useActiveWallet();
    const network = useActiveTonNetwork();

    return useMutation<void, Error, { config: TonWalletConfig; jetton: JettonBalance }>(
        async ({ config, jetton }) => {
            let newConfig: TonWalletConfig;

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

            client.setQueryData([wallet.id, network, QueryKey.walletConfig], newConfig);

            await setActiveWalletConfig(sdk.storage, wallet.id, network, newConfig);

            await client.invalidateQueries([wallet.id, QueryKey.jettons]);
        }
    );
};
