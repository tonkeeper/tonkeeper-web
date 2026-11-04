import { NFT } from '@tonkeeper/core/dist/entries/nft';

export type HomeCollectiblesState = 'loading' | 'empty' | 'all-hidden' | 'items';

export const resolveHomeCollectiblesState = (
    visibleNfts: NFT[] | undefined,
    allNfts: NFT[] | undefined
): HomeCollectiblesState => {
    if (!visibleNfts || !allNfts) return 'loading';
    if (visibleNfts.length > 0) return 'items';
    if (allNfts.length > 0) return 'all-hidden';
    return 'empty';
};
