import { NFT } from '@tonkeeper/core/dist/entries/nft';

/** Native Tonkeeper burn destination: sending an NFT here makes it unrecoverable. */
export const NFT_BURN_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

/** The 500x500 preview when tonapi has one, else the first available. */
export const nftPreviewImage = (nft: NFT): string | undefined =>
    nft.previews?.find(p => p.resolution === '500x500')?.url ?? nft.previews?.[0]?.url;

/** dns.ton.org management page for a `.ton` domain item. */
export const tonDnsManageUrl = (domain: string): string =>
    `https://dns.ton.org/#${domain.replace(/\.ton$/, '')}`;
