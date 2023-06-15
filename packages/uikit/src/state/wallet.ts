import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import {NFT, NFTDNS} from '@tonkeeper/core/dist/entries/nft';
import {
  accountLogOutWallet,
  getAccountState,
} from '@tonkeeper/core/dist/service/accountService';
import { getWalletBackup } from '@tonkeeper/core/dist/service/backupService';
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
    NftItemRepr, NftItemsRepr,
    WalletApi,
} from '@tonkeeper/core/dist/tonApiV1';
import {AccountsApi, DNSApi, DnsExpiring, DnsRecord} from '@tonkeeper/core/dist/tonApiV2';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useStorage } from '../hooks/storage';
import { JettonKey, QueryKey } from '../libs/queryKey';
import { DefaultRefetchInterval } from './tonendpoint';

export const checkWalletBackup = () => {
  const wallet = useWalletContext();
  const { tonApi } = useAppContext();
  return useQuery(
    ['voucher'],
    async () => {
      if (!wallet.voucher) {
        return;
      }

      const backup = await getWalletBackup(
        tonApi,
        wallet.publicKey,
        wallet.voucher
      );

      console.log(backup);
    },
    { retry: 0 }
  );
};

export const useActiveWallet = () => {
  const storage = useStorage();
  return useQuery<WalletState | null, Error>(
    [QueryKey.account, QueryKey.wallet],
    async () => {
      const account = await getAccountState(storage);
      if (!account.activePublicKey) return null;
      return await getWalletState(storage, account.activePublicKey);
    }
  );
};

export const useWalletState = (publicKey: string) => {
  const storage = useStorage();
  return useQuery<WalletState | null, Error>(
    [QueryKey.account, QueryKey.wallet, publicKey],
    () => getWalletState(storage, publicKey)
  );
};

export const useMutateLogOut = (publicKey: string, remove = false) => {
  const storage = useStorage();
  const client = useQueryClient();
  const { tonApi } = useAppContext();
  return useMutation<void, Error, void>(async () => {
    await accountLogOutWallet(storage, tonApi, publicKey, remove);
    await client.invalidateQueries([QueryKey.account]);
  });
};

export const useMutateRenameWallet = (wallet: WalletState) => {
  const storage = useStorage();
  const client = useQueryClient();
  const { tonApi } = useAppContext();
  return useMutation<void, Error, string>(async (name) => {
    if (name.length <= 0) {
      throw new Error('Missing name');
    }

    await updateWalletProperty(tonApi, storage, wallet, { name });
    await client.invalidateQueries([QueryKey.account]);
  });
};

export const useMutateWalletProperty = () => {
  const storage = useStorage();
  const wallet = useWalletContext();
  const client = useQueryClient();
  const { tonApi } = useAppContext();
  return useMutation<
    void,
    Error,
    Pick<
      WalletState,
      'name' | 'hiddenJettons' | 'orderJettons' | 'lang' | 'fiat' | 'network'
    >
  >(async (props) => {
    await updateWalletProperty(tonApi, storage, wallet, props);
    await client.invalidateQueries([QueryKey.account]);
  });
};

export const useWalletAddresses = () => {
  const wallet = useWalletContext();
  const { tonApi } = useAppContext();
  return useQuery<string[], Error>([wallet.publicKey, QueryKey.addresses], () =>
    getWalletActiveAddresses(tonApi, wallet)
  );
};

export const useWalletAccountInfo = () => {
  const wallet = useWalletContext();
  const { tonApi } = useAppContext();
  return useQuery<AccountRepr, Error>(
    [wallet.publicKey, QueryKey.info],
    async () => {
      return await new AccountApi(tonApi).getAccountInfo({
        account: wallet.active.rawAddress,
      });
    },
    {
      refetchInterval: DefaultRefetchInterval,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      keepPreviousData: true,
    }
  );
};

export const useWalletJettonList = () => {
  const wallet = useWalletContext();
  const { tonApi } = useAppContext();
  const client = useQueryClient();
  return useQuery<JettonsBalances, Error>(
    [wallet.publicKey, QueryKey.jettons],
    async () => {
      const result = await new JettonApi(tonApi).getJettonsBalances({
        account: wallet.active.rawAddress,
      });

      result.balances.forEach((item) => {
        client.setQueryData(
          [
            wallet.publicKey,
            QueryKey.jettons,
            JettonKey.balance,
            item.jettonAddress,
          ],
          item
        );
      });

      return result;
    },
    {
      refetchInterval: DefaultRefetchInterval,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      keepPreviousData: true,
    }
  );
};

export const expiringNFTDaysPeriod = 30; // TODO set 360 for tests

export const useWalletNftList = () => {
  const wallet = useWalletContext();
  const { tonApiV2, tonApi } = useAppContext();

  return useQuery<NFT[], Error>(
    [wallet.publicKey, QueryKey.nft],
    async () => {
      const { wallets } = await new WalletApi(tonApi).findWalletsByPubKey({
        publicKey: wallet.publicKey,
      });
      const result = wallets
        .filter((item) => item.balance > 0 || item.status === 'active')
        .map((wallet) => wallet.address);

      const rawNftsLists$ = Promise.all(
        result.map((owner) =>
          new NFTApi(tonApi).searchNFTItems({
            owner: owner,
            offset: 0,
            limit: 1000,
            includeOnSale: true,
          })
        )
      );

        const dnsRecordsLists$ = Promise.all(
            result.map((owner) => new AccountsApi(tonApiV2).getDnsExpiring({
                    accountId: owner,
                    period: expiringNFTDaysPeriod
                })
            )
        );

        const [rawNftsLists, dnsRecordsLists] = await Promise.all([rawNftsLists$, dnsRecordsLists$]);
        const rawNfts = rawNftsLists.flatMap(item => item.nftItems);
        const dnsRecords = dnsRecordsLists.flatMap(item => item.items);

        const nftItems: NFT[] = rawNfts.map(nft => {
            const dns = dnsRecords.find(record => record.name === nft.dns);
            if (!dns) {
                return nft;
            }

            return  {
                ...nft,
                expiresAt: new Date(dns.expiringAt)
            }
        })

      return nftItems;
    },
    {
      refetchInterval: DefaultRefetchInterval,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      keepPreviousData: true,
    }
  );
};

export const useNftDNSLinkData = (nft: NFT) => {
    const { tonApiV2 } = useAppContext();

    return useQuery<DnsRecord | null, Error>(
        ['dns_link', nft?.address],
        () => {
            const { dns: domainName } = nft;
            if (!domainName) return null;

            return new DNSApi(tonApiV2).dnsResolve({domainName});
        },
        { enabled: nft.dns != null }
    );
};

export const useNftCollectionData = (nft: NftItemRepr) => {
  const { tonApi } = useAppContext();

  return useQuery<NftCollection | null, Error>(
    [nft?.address, QueryKey.nftCollection],
    async () => {
      const { collection } = nft!;
      if (!collection) return null;

      return await new NFTApi(tonApi).getNftCollection({
        account: collection.address,
      });
    },
    { enabled: nft.collection != null }
  );
};

export const useNftItemData = (address?: string) => {
  const { tonApi } = useAppContext();

  return useQuery<NftItemRepr, Error>(
    [address, QueryKey.nft],
    async () => {
      const result = await new NFTApi(tonApi).getNFTItems({
        addresses: [address!],
      });
      if (!result.nftItems.length) {
        throw new Error('missing nft data');
      }
      return result.nftItems[0];
    },
    { enabled: address != undefined }
  );
};
