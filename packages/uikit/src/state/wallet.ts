import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { WalletState, WalletVersion, walletVersionText } from '@tonkeeper/core/dist/entries/wallet';
import { accountLogOutWallet, getAccountState } from '@tonkeeper/core/dist/service/accountService';
import { getWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import { updateWalletProperty } from '@tonkeeper/core/dist/service/walletService';
import {
    Account,
    AccountsApi,
    BlockchainApi,
    DNSApi,
    DnsRecord,
    JettonsBalances,
    NFTApi,
    NftCollection,
    NftItem,
    WalletApi
} from '@tonkeeper/core/dist/tonApiV2';
import { isTONDNSDomain } from '@tonkeeper/core/dist/utils/nft';
import { Address } from 'ton';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useStorage } from '../hooks/storage';
import { JettonKey, QueryKey } from '../libs/queryKey';
import { getRateKey, toTokenRate } from './rates';
import { DefaultRefetchInterval } from './tonendpoint';

export const useActiveWallet = () => {
    const sdk = useAppSdk();
    return useQuery<WalletState | null, Error>([QueryKey.account, QueryKey.wallet], async () => {
        const account = await getAccountState(sdk.storage);
        if (!account.activePublicKey) return null;
        return getWalletState(sdk.storage, account.activePublicKey);
    });
};

export const useWalletState = (publicKey: string) => {
    const sdk = useAppSdk();
    return useQuery<WalletState | null, Error>([QueryKey.account, QueryKey.wallet, publicKey], () =>
        getWalletState(sdk.storage, publicKey)
    );
};

export const useWalletsState = () => {
    const { account } = useAppContext();
    const sdk = useAppSdk();
    return useQuery<(WalletState | null)[], Error>(
        [QueryKey.account, QueryKey.wallets, account.publicKeys],
        () => Promise.all(account.publicKeys.map(key => getWalletState(sdk.storage, key)))
    );
};

export const useMutateLogOut = (publicKey: string, remove = false) => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, void>(async () => {
        await accountLogOutWallet(sdk.storage, publicKey, remove);
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useMutateRenameWallet = (wallet: WalletState) => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation<void, Error, { name?: string; emoji?: string }>(async form => {
        if (form.name !== undefined && form.name.length <= 0) {
            throw new Error('Missing name');
        }

        const formToUpdate = {
            ...(form.emoji && { emoji: form.emoji }),
            ...(form.name && { name: form.name })
        };

        await updateWalletProperty(sdk.storage, wallet, formToUpdate);
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useMutateWalletProperty = (clearWallet = false) => {
    const storage = useStorage();
    const wallet = useWalletContext();
    const client = useQueryClient();

    return useMutation<
        void,
        Error,
        Partial<
            Pick<
                WalletState,
                'name' | 'hiddenJettons' | 'orderJettons' | 'lang' | 'fiat' | 'network' | 'emoji'
            >
        >
    >(async props => {
        await updateWalletProperty(storage, wallet, props);
        await client.invalidateQueries([QueryKey.account]);
        if (clearWallet) {
            await client.invalidateQueries([wallet.publicKey]);
        }
    });
};

export const useWalletAddresses = () => {
    const wallet = useWalletContext();
    const {
        api: { tonApiV2 }
    } = useAppContext();
    return useQuery<string[], Error>([wallet.publicKey, QueryKey.addresses], async () => {
        const { accounts } = await new WalletApi(tonApiV2).getWalletsByPublicKey({
            publicKey: wallet.publicKey
        });
        const result = accounts
            .filter(item => item.balance > 0 || item.status === 'active')
            .map(w => w.address);

        if (result.length > 0) {
            return result;
        } else {
            return [wallet.active.rawAddress];
        }
    });
};

export const useWalletAccountInfo = () => {
    const wallet = useWalletContext();
    const { api } = useAppContext();
    return useQuery<Account, Error>(
        [wallet.active.rawAddress, QueryKey.info],
        async () => {
            return new AccountsApi(api.tonApiV2).getAccount({
                accountId: wallet.active.rawAddress
            });
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchIntervalInBackground: true,
            refetchOnWindowFocus: true,
            keepPreviousData: true
        }
    );
};

export const useWalletJettonList = () => {
    const wallet = useWalletContext();
    const { api, fiat } = useAppContext();
    const client = useQueryClient();
    return useQuery<JettonsBalances, Error>(
        [wallet.active.rawAddress, QueryKey.jettons, fiat, wallet.network],
        async () => {
            const result = await new AccountsApi(api.tonApiV2).getAccountJettonsBalances({
                accountId: wallet.active.rawAddress,
                currencies: fiat
            });

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

            return result;
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchIntervalInBackground: true,
            refetchOnWindowFocus: true,
            keepPreviousData: true
        }
    );
};

const getActiveWallet = (accounts: Account[], version: WalletVersion) => {
    return accounts.find(
        item =>
            (item.balance > 0 || item.status === 'active') &&
            item.interfaces &&
            item.interfaces.some(
                v =>
                    v === `wallet_${walletVersionText(version)}` ||
                    v === `wallet_${walletVersionText(version).toLowerCase()}`
            )
    );
};

export const useWalletNftList = () => {
    const wallet = useWalletContext();
    const {
        api: { tonApiV2 }
    } = useAppContext();

    return useQuery<NFT[], Error>(
        [wallet.publicKey, QueryKey.nft],
        async () => {
            const { accounts } = await new WalletApi(tonApiV2).getWalletsByPublicKey({
                publicKey: wallet.publicKey
            });

            const result = [WalletVersion.V4R2, WalletVersion.V3R2, WalletVersion.V3R1].reduce(
                (acc, version) => {
                    const account = getActiveWallet(accounts, version);
                    if (account) {
                        acc.push(account.address);
                    }
                    return acc;
                },
                [] as string[]
            );

            if (result.length === 0) {
                result.push(wallet.active.rawAddress);
            }

            const items = await Promise.all(
                result.map(owner =>
                    new AccountsApi(tonApiV2).getAccountNftItems({
                        accountId: owner,
                        offset: 0,
                        limit: 1000,
                        indirectOwnership: true
                    })
                )
            );

            return items.reduce((acc, account) => acc.concat(account.nftItems), [] as NftItem[]);
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchIntervalInBackground: true,
            refetchOnWindowFocus: true,
            keepPreviousData: true
        }
    );
};
export const useNftDNSLinkData = (nft: NFT) => {
    const {
        api: { tonApiV2 }
    } = useAppContext();

    return useQuery<DnsRecord | null, Error>(
        ['dns_link', nft?.address],
        async () => {
            const { dns: domainName } = nft;
            if (!domainName) return null;

            try {
                return await new DNSApi(tonApiV2).dnsResolve({ domainName });
            } catch (e) {
                return null;
            }
        },
        { enabled: nft.dns != null }
    );
};

const MINUTES_IN_YEAR = 60 * 60 * 24 * 366;
export const useNftDNSExpirationDate = (nft: NFT) => {
    const {
        api: { tonApiV2 }
    } = useAppContext();

    return useQuery<Date | null, Error>(['dns_expiring', nft.address], async () => {
        if (!nft.owner?.address || !nft.dns || !isTONDNSDomain(nft.dns)) {
            return null;
        }

        try {
            const result = await new BlockchainApi(tonApiV2).execGetMethodForBlockchainAccount({
                accountId: nft.address,
                methodName: 'get_last_fill_up_time'
            });

            const lastRefill = result?.decoded?.last_fill_up_time;
            if (lastRefill && typeof lastRefill === 'number' && isFinite(lastRefill)) {
                return new Date((lastRefill + MINUTES_IN_YEAR) * 1000);
            }

            return null;
        } catch (e) {
            return null;
        }
    });
};

export const useNftCollectionData = (nft: NftItem) => {
    const {
        api: { tonApiV2 }
    } = useAppContext();

    return useQuery<NftCollection | null, Error>(
        [nft?.address, QueryKey.nftCollection],
        async () => {
            const { collection } = nft!;
            if (!collection) return null;

            return new NFTApi(tonApiV2).getNftCollection({
                accountId: collection.address
            });
        },
        { enabled: nft.collection != null }
    );
};

export const useNftItemData = (address?: string) => {
    const {
        api: { tonApiV2 }
    } = useAppContext();

    return useQuery<NftItem, Error>(
        [address, QueryKey.nft],
        async () => {
            const result = await new NFTApi(tonApiV2).getNftItemByAddress({
                accountId: address!
            });
            return result;
        },
        { enabled: address !== undefined }
    );
};
