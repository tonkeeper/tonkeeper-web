import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { KNOWN_TON_ASSETS } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { AuthState } from '@tonkeeper/core/dist/entries/password';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { accountLogOutWallet, getAccountState } from '@tonkeeper/core/dist/service/accountService';
import { getWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import {
    getWalletAuthState,
    updateWalletProperty
} from '@tonkeeper/core/dist/service/walletService';
import {
    Account,
    AccountsApi,
    BlockchainApi,
    DNSApi,
    DnsRecord,
    JettonBalance,
    NFTApi,
    NftCollection,
    NftItem,
    WalletApi
} from '@tonkeeper/core/dist/tonApiV2';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { isTONDNSDomain } from '@tonkeeper/core/dist/utils/nft';
import BigNumber from 'bignumber.js';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useStorage } from '../hooks/storage';
import { QueryKey } from '../libs/queryKey';
import { useAssets } from './home';
import {
    getJettonsFiatAmount,
    tokenRate as getTokenRate,
    getTonFiatAmount,
    useRate
} from './rates';
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

export const useWalletAuthState = (publicKey: string) => {
    const sdk = useAppSdk();
    return useQuery<AuthState, Error>([QueryKey.account, QueryKey.password, publicKey], () =>
        getWalletAuthState(sdk.storage, publicKey)
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
                'name' | 'hiddenJettons' | 'orderJettons' | 'lang' | 'network' | 'emoji'
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

export const useWalletNftList = () => {
    const wallet = useWalletContext();
    const {
        api: { tonApiV2 }
    } = useAppContext();

    return useQuery<NFT[], Error>(
        [wallet.active.rawAddress, QueryKey.nft],
        async () => {
            const { nftItems } = await new AccountsApi(tonApiV2).getAccountNftItems({
                accountId: wallet.active.rawAddress,
                offset: 0,
                limit: 1000,
                indirectOwnership: true
            });
            return nftItems;
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

export const useNftCollectionData = (nftOrCollection: NftItem | string) => {
    const {
        api: { tonApiV2 }
    } = useAppContext();

    const collectionAddress =
        typeof nftOrCollection === 'string' ? nftOrCollection : nftOrCollection.collection?.address;

    return useQuery<NftCollection | null, Error>(
        [collectionAddress, QueryKey.nftCollection],
        async () => {
            if (!collectionAddress) return null;

            return new NFTApi(tonApiV2).getNftCollection({
                accountId: collectionAddress
            });
        },
        { enabled: !!collectionAddress }
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

export const useWalletTotalBalance = (fiat: FiatCurrencies) => {
    const [assets] = useAssets();
    const { data: tonRate } = useRate(CryptoCurrency.TON);

    const client = useQueryClient();
    return useQuery<BigNumber>(
        [QueryKey.total, fiat, assets, tonRate],
        () => {
            if (!assets) {
                return new BigNumber(0);
            }
            return (
                getTonFiatAmount(client, fiat, assets)
                    // .plus(getTRC20FiatAmount(client, fiat, assets)) // TODO: ENABLE TRON
                    .plus(getJettonsFiatAmount(client, fiat, assets))
            );
        },
        { enabled: !!assets && !!tonRate }
    );
};

export interface TokenMeta {
    address: string;
    name: string;
    symbol: string;
    color: string;
    image: string;
    balance: BigNumber;
    price: number;
}

export interface TokenDistribution {
    percent: number;
    fiatBalance: BigNumber;
    meta:
        | TokenMeta
        | {
              type: 'others';
              color: string;
              tokens: TokenMeta[];
          };
}

export function useAssetsDistribution(maxGropusNumber = 10) {
    const [assets] = useAssets();
    const { fiat } = useAppContext();
    const { data: tonRate } = useRate(CryptoCurrency.TON);

    const client = useQueryClient();
    return useQuery<TokenDistribution[]>(
        [QueryKey.distribution, fiat, assets, tonRate, maxGropusNumber],
        () => {
            if (!assets) {
                return [];
            }

            const ton: Omit<TokenDistribution, 'percent'> = {
                fiatBalance: getTonFiatAmount(client, fiat, assets),
                meta: convertJettonToTokenMeta(
                    { isNative: true, balance: assets.ton.info.balance },
                    getTokenRate(client, fiat, CryptoCurrency.TON)?.prices || 0
                )
            };

            const tokensOmited: Omit<TokenDistribution, 'percent'>[] = [ton].concat(
                assets.ton.jettons.balances.map(b => {
                    const price =
                        getTokenRate(client, fiat, Address.parse(b.jetton.address).toString())
                            ?.prices || 0;
                    const fiatBalance = shiftedDecimals(b.balance, b.jetton.decimals).multipliedBy(
                        price
                    );

                    return {
                        fiatBalance,
                        meta: convertJettonToTokenMeta(b, price)
                    };
                })
            );

            const total = tokensOmited.reduce(
                (acc, t) => t.fiatBalance.plus(acc),
                new BigNumber(0)
            );

            tokensOmited.sort((a, b) => b.fiatBalance.minus(a.fiatBalance).toNumber());

            const tokens: TokenDistribution[] = tokensOmited
                .slice(0, maxGropusNumber - 1)
                .map(t => ({
                    ...t,
                    percent: t.fiatBalance
                        .dividedBy(total)
                        .multipliedBy(100)
                        .decimalPlaces(2)
                        .toNumber()
                }));

            const includedPercent = tokens.reduce((acc, t) => t.percent + acc, 0);
            const includedBalance = tokens.reduce(
                (acc, t) => t.fiatBalance.plus(acc),
                new BigNumber(0)
            );

            if (tokensOmited.length > maxGropusNumber) {
                tokens.push({
                    percent: new BigNumber(100 - includedPercent).decimalPlaces(2).toNumber(),
                    fiatBalance: total.minus(includedBalance),
                    meta: {
                        type: 'others',
                        color: '#9DA2A4',
                        tokens: tokensOmited
                            .slice(maxGropusNumber - 1)
                            .map(t => t.meta) as TokenMeta[]
                    }
                });
            }

            return tokens;
        },
        { enabled: !!assets && !!tonRate }
    );
}
function tokenColor(tokenAddress: string) {
    if (tokenAddress === 'TON') {
        return '#0098EA';
    }

    const address = Address.parse(tokenAddress);

    if (address.equals(KNOWN_TON_ASSETS.jUSDT)) {
        return '#2AAF86';
    }

    const addressId = Number('0x' + address.toRawString().slice(-10));

    const restColors = [
        '#FF8585',
        '#FFA970',
        '#FFC95C',
        '#85CC7A',
        '#70A0FF',
        '#6CCCF5',
        '#AD89F5',
        '#F57FF5',
        '#F576B1',
        '#293342'
    ];

    return restColors[addressId % restColors.length];
}

function convertJettonToTokenMeta(
    asset: JettonBalance | { isNative: true; balance: number },
    price: number
): TokenMeta {
    if ('isNative' in asset) {
        return {
            address: 'TON',
            name: 'TON',
            symbol: 'TON',
            color: tokenColor('TON'),
            image: 'https://wallet.tonkeeper.com/img/toncoin.svg',
            price,
            balance: new BigNumber(asset.balance)
        };
    }

    return {
        address: asset.jetton.address,
        name: asset.jetton.name,
        symbol: asset.jetton.symbol,
        color: tokenColor(asset.jetton.address),
        image: asset.jetton.image,
        balance: new BigNumber(asset.balance),
        price
    };
}
