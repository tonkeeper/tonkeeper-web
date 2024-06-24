import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useMutation } from '@tanstack/react-query';
import { getActiveWalletConfig } from '@tonkeeper/core/dist/service/wallet/configService';
import { useActiveWalletConfig, useMutateActiveWalletConfig } from './wallet';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { useTonenpointConfig } from './tonendpoint';
import { ActiveWalletConfig } from '@tonkeeper/core/dist/entries/wallet';
import { useTranslation } from '../hooks/translation';

type NftWithCollectionId = Pick<NFT, 'address'> & {
    collection?: Pick<Required<NFT>['collection'], 'address'>;
};

export const useMarkNftAsSpam = () => {
    const wallet = useWalletContext();
    const sdk = useAppSdk();
    const { mutateAsync } = useMutateActiveWalletConfig();
    const { tonendpoint } = useAppContext();
    const { data: tonendpointConfig } = useTonenpointConfig(tonendpoint);
    const { t } = useTranslation();
    return useMutation<void, Error, NftWithCollectionId>(async nft => {
        let config = await getActiveWalletConfig(
            sdk.storage,
            wallet.active.rawAddress,
            wallet.network
        );

        const address = nft.collection?.address || nft.address;

        if (!config.spamNfts.includes(address) && tonendpointConfig?.scam_api_url) {
            let baseUrl = tonendpointConfig?.scam_api_url;
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
        sdk.topMessage(
            nft.collection?.address
                ? t('suspicious_status_update_spam_collection')
                : t('suspicious_status_update_spam_nft')
        );
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
    const { t } = useTranslation();
    return useMutation<void, Error, NftWithCollectionId>(async nft => {
        let config = await getActiveWalletConfig(
            sdk.storage,
            wallet.active.rawAddress,
            wallet.network
        );

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

export function useIsSpamNft(nft: (NftWithCollectionId & { trust: NFT['trust'] }) | undefined) {
    const { data: config } = useActiveWalletConfig();
    return isSpamNft(nft, config);
}

export function useIsUnverifiedNft(
    nft: (NftWithCollectionId & { trust: NFT['trust'] }) | undefined
) {
    const { data: config } = useActiveWalletConfig();
    return isUnverifiedNft(nft, config);
}

export const isSpamNft = (
    nft: (NftWithCollectionId & { trust: NFT['trust'] }) | undefined,
    config: ActiveWalletConfig | undefined
) => {
    return Boolean(
        nft &&
            (!!config?.spamNfts.includes(nft.collection?.address || nft.address) ||
                (nft.trust === 'blacklist' &&
                    !config?.trustedNfts.includes(nft.collection?.address || nft.address)))
    );
};

export const isUnverifiedNft = (
    nft: (NftWithCollectionId & { trust: NFT['trust'] }) | undefined,
    config: ActiveWalletConfig | undefined
) => {
    return Boolean(
        nft &&
            nft.trust !== 'whitelist' &&
            !config?.trustedNfts.includes(nft.collection?.address || nft.address)
    );
};
