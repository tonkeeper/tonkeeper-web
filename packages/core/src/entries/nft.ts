import { NftItem } from '../tonApiV2';

export type NFT = NftItem | NFTDNS;

export type NFTDNS = NftItem & {
    dns: string;
};

export function isNFTDNS(nft: NFT): nft is NFTDNS {
    return !!nft.dns;
}
