import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { TonWalletConfig } from '@tonkeeper/core/dist/entries/wallet';

type NftWithCollectionId = Pick<NFT, 'address'> & {
    collection?: Pick<Required<NFT>['collection'], 'address'>;
};

export const isSpamNft = (
    nft: (NftWithCollectionId & { trust: NFT['trust'] }) | undefined,
    config: TonWalletConfig | undefined
) => {
    if (!nft) {
        return true;
    }
    const address = nft.collection?.address || nft.address;
    if (config?.spamNfts.includes(address)) {
        return true;
    }

    if (config?.trustedNfts.includes(address)) {
        return false;
    }

    return ['blacklist', 'graylist'].includes(nft.trust);
};

export const isUnverifiedNft = (
    nft: (NftWithCollectionId & { trust: NFT['trust'] }) | undefined,
    config: TonWalletConfig | undefined
) => {
    return Boolean(
        nft &&
            nft.trust !== 'whitelist' &&
            !config?.trustedNfts.includes(nft.collection?.address || nft.address)
    );
};
