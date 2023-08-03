import { BLOCKCHAIN_NAME } from '../../crypto';
import { packAssetId } from './asset';
import { TonAsset } from './ton-asset';
import { TronAsset } from './tron-asset';

export const TRON_USDT_ASSET: TronAsset = {
    id: packAssetId(BLOCKCHAIN_NAME.TRON, 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'),
    symbol: 'USDT',
    name: 'Tether USDT',
    decimals: 6,
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    blockchain: BLOCKCHAIN_NAME.TRON
};

export const TON_ASSET: TonAsset = {
    id: packAssetId(BLOCKCHAIN_NAME.TON, 'TON'),
    symbol: 'TON',
    name: 'Ton Coin',
    decimals: 9,
    address: 'TON',
    blockchain: BLOCKCHAIN_NAME.TON
};
