import { BLOCKCHAIN_NAME } from '../../crypto';
import { Asset } from './asset';

export interface TronAssetIdentification {
    address: string; // base53 | 'TRX'
    blockchain: BLOCKCHAIN_NAME.TRON;
}

export interface TronAsset extends Asset, TronAssetIdentification {}
