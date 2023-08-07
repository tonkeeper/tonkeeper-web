import { BLOCKCHAIN_NAME } from '../../crypto';
import { BasicAsset } from './basic-asset';

export interface TronAssetIdentification {
    address: string; // base53 | 'TRX'
    blockchain: BLOCKCHAIN_NAME.TRON;
}

export interface TronAsset extends BasicAsset, TronAssetIdentification {}
