import { Address } from '@ton/core';
import { BLOCKCHAIN_NAME } from '../../crypto';

export interface BasicAsset {
    id: string;
    symbol: string;
    decimals: number;
    name?: string;
    image?: string;
}

export function packAssetId(blockchain: BLOCKCHAIN_NAME, address: string | Address): string {
    return blockchain + '__' + (typeof address === 'string' ? address : address.toRawString());
}

export function isBasicAsset(value: object): value is BasicAsset {
    return 'id' in value && 'symbol' in value && 'decimals' in value;
}
