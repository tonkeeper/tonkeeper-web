import { useMutation, useQuery } from '@tanstack/react-query';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { getActiveWalletConfig } from '@tonkeeper/core/dist/service/wallet/configService';
import {
    AccountsApi,
    DNSApi,
    DnsRecord,
    NFTApi,
    NftCollection,
    NftItem
} from '@tonkeeper/core/dist/tonApiV2';
import { isTONDNSDomain } from '@tonkeeper/core/dist/utils/nft';
import { loadAllNftPages } from '@tonkeeper/core/dist/utils/nftPagination';
import { joinUrl } from '@tonkeeper/core/dist/utils/url';
import { useMemo } from 'react';
import { isSpamNft, isUnverifiedNft } from './nft-classification';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { QueryKey } from '../libs/queryKey';
import {
    useActiveApi,
    useActiveTonNetwork,
    useActiveTonWalletConfig,
    useActiveWallet,
    useMutateActiveTonWalletConfig
} from './wallet';

type NftWithCollectionId = Pick<NFT, 'address'> & {
    collection?: Pick<Required<NFT>['collection'], 'address'>;
};

export const useMarkNftAsSpam = () => {
    const wallet = useActiveWallet();
    const sdk = useAppSdk();
    const { mutateAsync } = useMutateActiveTonWalletConfig();
    const { mainnetConfig } = useAppContext();
    const { t } = useTranslation();
    const network = useActiveTonNetwork();
    return useMutation<void, Error, NftWithCollectionId>(async nft => {
        let config = await getActiveWalletConfig(sdk, wallet.rawAddress, network);

        const address = nft.collection?.address || nft.address;

        if (!config.spamNfts.includes(address) && mainnetConfig?.scam_api_url) {
            try {
                await fetch(joinUrl(mainnetConfig.scam_api_url, `/report/${address}`), {
                    method: 'POST'
                });
            } catch (e) {
                console.error(e);
            }
        }

        config = {
            ...config,
            spamNfts: config.spamNfts.filter(i => i !== address).concat(address),
            trustedNfts: config.trustedNfts.filter(item => item !== address)
        };

        await mutateAsync(config);
        sdk.topMessage(
            nft.collection?.address
                ? t('suspicious_status_update_spam_collection')
                : t('suspicious_status_update_spam_nft')
        );
    });
};

export const useMarkNftAsTrusted = () => {
    const wallet = useActiveWallet();
    const sdk = useAppSdk();
    const { mutateAsync } = useMutateActiveTonWalletConfig();
    const network = useActiveTonNetwork();
    return useMutation<void, Error, NftWithCollectionId | string>(async nft => {
        let config = await getActiveWalletConfig(sdk, wallet.rawAddress, network);

        const address = typeof nft === 'string' ? nft : nft.collection?.address || nft.address;

        config = {
            ...config,
            spamNfts: config.spamNfts.filter(item => item !== address),
            trustedNfts: config.trustedNfts.filter(i => i !== address).concat(address)
        };

        await mutateAsync(config);
    });
};

export const useHideNft = () => {
    const wallet = useActiveWallet();
    const sdk = useAppSdk();
    const { mutateAsync } = useMutateActiveTonWalletConfig();
    const { t } = useTranslation();
    const network = useActiveTonNetwork();
    return useMutation<void, Error, NftWithCollectionId>(async nft => {
        let config = await getActiveWalletConfig(sdk, wallet.rawAddress, network);

        const address = nft.collection?.address || nft.address;

        if (config.hiddenNfts.includes(address)) {
            return;
        }

        config = {
            ...config,
            hiddenNfts: config.hiddenNfts.filter(i => i !== address).concat(address)
        };

        await mutateAsync(config);
        sdk.topMessage(
            nft.collection?.address
                ? t('suspicious_status_update_hidden_collection')
                : t('suspicious_status_update_hidden_nft')
        );
    });
};

export const useMakeNftVisible = () => {
    const wallet = useActiveWallet();
    const sdk = useAppSdk();
    const { mutateAsync } = useMutateActiveTonWalletConfig();
    const network = useActiveTonNetwork();
    return useMutation<void, Error, NftWithCollectionId | string>(async nft => {
        let config = await getActiveWalletConfig(sdk, wallet.rawAddress, network);

        const address = typeof nft === 'string' ? nft : nft.collection?.address || nft.address;

        config = {
            ...config,
            hiddenNfts: config.hiddenNfts.filter(item => item !== address)
        };

        await mutateAsync(config);
    });
};

export function useIsSpamNft(nft: (NftWithCollectionId & { trust: NFT['trust'] }) | undefined) {
    const { data: config } = useActiveTonWalletConfig();
    return isSpamNft(nft, config);
}

export function useIsUnverifiedNft(
    nft: (NftWithCollectionId & { trust: NFT['trust'] }) | undefined
) {
    const { data: config } = useActiveTonWalletConfig();
    return isUnverifiedNft(nft, config);
}

export { isSpamNft, isUnverifiedNft } from './nft-classification';

export const useWalletNftList = () => {
    const wallet = useActiveWallet();
    const { tonApiV2 } = useActiveApi();
    const network = useActiveTonNetwork();

    return useQuery<NFT[], Error>(
        [wallet.rawAddress, QueryKey.nft, network],
        ({ signal }) =>
            loadAllNftPages(async (offset, limit, requestSignal) => {
                const { nftItems } = await new AccountsApi(tonApiV2).getAccountNftItems(
                    {
                        accountId: wallet.rawAddress,
                        offset,
                        limit,
                        indirectOwnership: true
                    },
                    { signal: requestSignal }
                );
                return nftItems;
            }, signal)
    );
};
export const useWalletFilteredNftList = () => {
    const { data: nfts, ...rest } = useWalletNftList();
    const { data: walletConfig } = useActiveTonWalletConfig();

    const filtered = useMemo(() => {
        if (!nfts || !walletConfig) return undefined;

        return nfts.filter(item => {
            const address = item.collection ? item.collection.address : item.address;

            if (isSpamNft(item, walletConfig)) {
                return false;
            }

            return !walletConfig?.hiddenNfts.includes(address);
        });
    }, [nfts, walletConfig]);

    return {
        data: filtered,
        ...rest
    };
};
/**
 * Filtered NFT list for wallet-facing galleries: spam and user-hidden items
 * removed (via `useWalletFilteredNftList`), plus items whose metadata asks
 * not to be rendered (`render_type: 'hidden'`).
 */
export const useWalletVisibleNftList = () => {
    const { data: nfts, ...rest } = useWalletFilteredNftList();

    const visible = useMemo(
        () => nfts?.filter(nft => nft.metadata?.render_type !== 'hidden'),
        [nfts]
    );

    return {
        data: visible,
        ...rest
    };
};

export const useNftDNSLinkData = (nft: NFT) => {
    const api = useActiveApi();

    return useQuery<DnsRecord | null, Error>(
        ['dns_link', nft?.address],
        async (): Promise<DnsRecord | null> => {
            const { dns: domainName } = nft;
            if (!domainName) return null;

            try {
                return await new DNSApi(api.tonApiV2).dnsResolve({ domainName });
            } catch (e) {
                return null;
            }
        },
        { enabled: nft.dns != null }
    );
};
/**
 * When a `.ton` domain expires, per tonapi's `expiring_at` — the same source
 * the native apps read, so all clients show one date.
 */
export const useNftDNSExpirationDate = (nft: NFT) => {
    const { tonApiV2 } = useActiveApi();

    return useQuery<Date | null, Error>(['dns_expiring', nft.address], async () => {
        if (!nft.owner?.address || !nft.dns || !isTONDNSDomain(nft.dns)) {
            return null;
        }

        try {
            const info = await new DNSApi(tonApiV2).getDnsInfo({ domainName: nft.dns });
            return info.expiringAt ? new Date(info.expiringAt * 1000) : null;
        } catch (e) {
            return null;
        }
    });
};
export const useNftCollectionData = (nftOrCollection: NftItem | string) => {
    const { tonApiV2 } = useActiveApi();

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
    const { tonApiV2 } = useActiveApi();

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
