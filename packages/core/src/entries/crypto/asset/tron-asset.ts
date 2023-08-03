import { BLOCKCHAIN_NAME } from '../../crypto';
import { Asset } from './asset';

export interface TronAsset extends Asset {
    address: string; // base53 | 'TRX'
    blockchain: BLOCKCHAIN_NAME.TRON;
}
