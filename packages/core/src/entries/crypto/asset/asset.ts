import { BLOCKCHAIN_NAME } from '../../crypto';

export interface Asset {
    id: string;
    symbol: string;
    decimals: number;
    name?: string;
}

export function packAssetId(blockchain: BLOCKCHAIN_NAME, address: string): string {
    return blockchain + '__' + address;
}

export function isAsset(value: object): value is Asset {
    return 'id' in value && 'symbol' in value && 'decimals' in value;
}
