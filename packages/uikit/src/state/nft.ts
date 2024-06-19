import { useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getActiveWalletConfig,
    setActiveWalletConfig
} from '@tonkeeper/core/dist/service/wallet/configService';
import { useMutateActiveWalletConfig } from './wallet';
import { QueryKey } from '../libs/queryKey';
import { NFT } from '@tonkeeper/core/dist/entries/nft';

type NftWithCollectionId = Pick<NFT, 'address'> & { collection?: NFT['collection'] };

export const useMarkNftAsSpam = () => {
    const wallet = useWalletContext();
    const sdk = useAppSdk();
    const { mutateAsync } = useMutateActiveWalletConfig();
    const client = useQueryClient();
    return useMutation<void, Error, NftWithCollectionId | string>(async nft => {
        let config = await getActiveWalletConfig(
            sdk.storage,
            wallet.active.rawAddress,
            wallet.network
        );

        const address = typeof nft === 'string' ? nft : nft.collection?.address || nft.address;

        if (!config.spamNfts.includes(address)) {
            // TODO make post request
        }

        config = {
            ...config,
            spamNfts: config.spamNfts.concat(address),
            trustedNfts: config.trustedNfts.slice().filter(item => item !== address)
        };

        await setActiveWalletConfig(sdk.storage, wallet.active.rawAddress, wallet.network, config);

        await client.invalidateQueries({
            predicate: q => q.queryKey.includes(QueryKey.walletConfig)
        });

        //  await mutateAsync(config);
    });
};

export const useMarkNftAsTrusted = () => {
    const wallet = useWalletContext();
    const sdk = useAppSdk();
    const { mutateAsync } = useMutateActiveWalletConfig();
    const client = useQueryClient();
    return useMutation<void, Error, NftWithCollectionId | string>(async nft => {
        let config = await getActiveWalletConfig(
            sdk.storage,
            wallet.active.rawAddress,
            wallet.network
        );

        const address = typeof nft === 'string' ? nft : nft.collection?.address || nft.address;

        config = {
            ...config,
            spamNfts: config.spamNfts.slice().filter(item => item !== address),
            trustedNfts: config.trustedNfts.slice().concat(address)
        };

        await setActiveWalletConfig(sdk.storage, wallet.active.rawAddress, wallet.network, config);

        await client.invalidateQueries({
            predicate: q => q.queryKey.includes(QueryKey.walletConfig)
        });

        // await mutateAsync(config);
    });
};

export const useHideNft = () => {
    const wallet = useWalletContext();
    const sdk = useAppSdk();
    const { mutateAsync } = useMutateActiveWalletConfig();
    return useMutation<void, Error, NftWithCollectionId | string>(async nft => {
        let config = await getActiveWalletConfig(
            sdk.storage,
            wallet.active.rawAddress,
            wallet.network
        );

        const address = typeof nft === 'string' ? nft : nft.collection?.address || nft.address;

        if (config.hiddenNfts.includes(address)) {
            return;
        }

        config = {
            ...config,
            hiddenNfts: config.hiddenNfts.slice().concat(address)
        };

        await mutateAsync(config);
    });
};

export const useMakeNftVisible = () => {
    const wallet = useWalletContext();
    const sdk = useAppSdk();
    const { mutateAsync } = useMutateActiveWalletConfig();
    return useMutation<void, Error, NftWithCollectionId | string>(async nft => {
        let config = await getActiveWalletConfig(
            sdk.storage,
            wallet.active.rawAddress,
            wallet.network
        );

        const address = typeof nft === 'string' ? nft : nft.collection?.address || nft.address;

        config = {
            ...config,
            hiddenNfts: config.hiddenNfts.filter(item => item !== address)
        };

        await mutateAsync(config);
    });
};
