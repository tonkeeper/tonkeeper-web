import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { WalletState, WalletVersion, walletVersionText } from '@tonkeeper/core/dist/entries/wallet';
import { accountLogOutWallet, getAccountState } from '@tonkeeper/core/dist/service/accountService';
import { getWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import { updateWalletProperty } from '@tonkeeper/core/dist/service/walletService';
import { getWalletActiveAddresses } from '@tonkeeper/core/dist/tonApiExtended/walletApi';
import {
    AccountApi,
    AccountRepr,
    JettonApi,
    JettonsBalances,
    NFTApi,
    NftCollection,
    NftItemRepr
} from '@tonkeeper/core/dist/tonApiV1';
import {
    Account,
    BlockchainApi,
    DNSApi,
    DnsRecord,
    WalletApi
} from '@tonkeeper/core/dist/tonApiV2';
import { isTONDNSDomain } from '@tonkeeper/core/dist/utils/nft';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useStorage } from '../hooks/storage';
import { JettonKey, QueryKey } from '../libs/queryKey';
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

export const useMutateLogOut = (publicKey: string, remove = false) => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const {
        api: { tonApi }
    } = useAppContext();
    return useMutation<void, Error, void>(async () => {
        await accountLogOutWallet(sdk.storage, tonApi, publicKey, remove);
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useMutateRenameWallet = (wallet: WalletState) => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const {
        api: { tonApi }
    } = useAppContext();
    return useMutation<void, Error, string>(async name => {
        if (name.length <= 0) {
            throw new Error('Missing name');
        }

        await updateWalletProperty(tonApi, sdk.storage, wallet, { name });
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useMutateWalletProperty = (clearWallet = false) => {
    const storage = useStorage();
    const wallet = useWalletContext();
    const client = useQueryClient();
    const {
        api: { tonApi }
    } = useAppContext();
    return useMutation<
        void,
        Error,
        Pick<WalletState, 'name' | 'hiddenJettons' | 'orderJettons' | 'lang' | 'fiat' | 'network'>
    >(async props => {
        await updateWalletProperty(tonApi, storage, wallet, props);
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
    return useQuery<string[], Error>([wallet.publicKey, QueryKey.addresses], () =>
        getWalletActiveAddresses(tonApiV2, wallet)
    );
};

export const useWalletAccountInfo = () => {
    const wallet = useWalletContext();
    const {
        api: { tonApi }
    } = useAppContext();
    return useQuery<AccountRepr, Error>(
        [wallet.publicKey, QueryKey.info],
        async () => {
            return new AccountApi(tonApi).getAccountInfo({
                account: wallet.active.rawAddress
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
    const {
        api: { tonApi }
    } = useAppContext();
    const client = useQueryClient();
    return useQuery<JettonsBalances, Error>(
        [wallet.publicKey, QueryKey.jettons],
        async () => {
            const result = await new JettonApi(tonApi).getJettonsBalances({
                account: wallet.active.rawAddress
            });

            result.balances.forEach(item => {
                client.setQueryData(
                    [wallet.publicKey, QueryKey.jettons, JettonKey.balance, item.jettonAddress],
                    item
                );
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
        api: { tonApiV2, tonApi }
    } = useAppContext();

    return useQuery<NFT[], Error>(
        [wallet.publicKey, QueryKey.nft],
        async () => {
            const { accounts } = await new WalletApi(tonApiV2).getWalletsByPublicKey({
                publicKey: wallet.publicKey
            });

            const result = [WalletVersion.V4R2, WalletVersion.V3R2, WalletVersion.V3R1].reduce(
                (acc, version) => {
                    const wallet = getActiveWallet(accounts, version);
                    if (wallet) {
                        acc.push(wallet.address);
                    }
                    return acc;
                },
                [] as string[]
            );

            const items = await Promise.all(
                result.map(owner =>
                    new NFTApi(tonApi).searchNFTItems({
                        owner: owner,
                        offset: 0,
                        limit: 1000,
                        includeOnSale: true
                    })
                )
            );

            return items.reduce(
                (acc, account) => acc.concat(account.nftItems),
                [] as NftItemRepr[]
            );
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

export const useNftCollectionData = (nft: NftItemRepr) => {
    const {
        api: { tonApi }
    } = useAppContext();

    return useQuery<NftCollection | null, Error>(
        [nft?.address, QueryKey.nftCollection],
        async () => {
            const { collection } = nft!;
            if (!collection) return null;

            return new NFTApi(tonApi).getNftCollection({
                account: collection.address
            });
        },
        { enabled: nft.collection != null }
    );
};

export const useNftItemData = (address?: string) => {
    const {
        api: { tonApi }
    } = useAppContext();

    return useQuery<NftItemRepr, Error>(
        [address, QueryKey.nft],
        async () => {
            const result = await new NFTApi(tonApi).getNFTItems({
                addresses: [address!]
            });
            if (!result.nftItems.length) {
                throw new Error('missing nft data');
            }
            return result.nftItems[0];
        },
        { enabled: address !== undefined }
    );
};
