import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useMutation } from '@tanstack/react-query';
import { getActiveWalletConfig } from '@tonkeeper/core/dist/service/wallet/configService';
import { useMutateActiveWalletConfig } from './wallet';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { useTonenpointConfig } from './tonendpoint';

type NftWithCollectionId = Pick<NFT, 'address'> & { collection?: NFT['collection'] };

export const useMarkNftAsSpam = () => {
    const wallet = useWalletContext();
    const sdk = useAppSdk();
    const { mutateAsync } = useMutateActiveWalletConfig();
    const { tonendpoint } = useAppContext();
    const { data: tonendpointConfig } = useTonenpointConfig(tonendpoint);
    return useMutation<void, Error, NftWithCollectionId | string>(async nft => {
        let config = await getActiveWalletConfig(
            sdk.storage,
            wallet.active.rawAddress,
            wallet.network
        );

        const address = typeof nft === 'string' ? nft : nft.collection?.address || nft.address;

        if (!config.spamNfts.includes(address) && tonendpointConfig?.scamEndpoint) {
            let baseUrl = tonendpointConfig?.scamEndpoint;
            if (baseUrl.endsWith('/')) {
                baseUrl = baseUrl.slice(0, baseUrl.length - 1);
            }
            try {
                await fetch(`${baseUrl}/report/${address}`, {
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
    });
};

export const useMarkNftAsTrusted = () => {
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
            spamNfts: config.spamNfts.filter(item => item !== address),
            trustedNfts: config.trustedNfts.filter(i => i !== address).concat(address)
        };

        await mutateAsync(config);
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
            hiddenNfts: config.hiddenNfts.filter(i => i !== address).concat(address)
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
