import {NftItemRepr} from "../tonApiV1";

export type NFT = NftItemRepr | NFTDNS;

export type NFTDNS = NftItemRepr & {
    dns: string;
}

export function isNFTDNS(nft: NFT): nft is NFTDNS {
    return !!nft.dns;
}
