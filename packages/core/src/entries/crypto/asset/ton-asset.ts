import { Address } from 'ton-core';
import { Asset, packAssetId } from './asset';
import { BLOCKCHAIN_NAME } from '../../crypto';
import { JettonsBalances } from '../../../tonApiV1';
import { TON_ASSET } from './constants';

export interface TonAsset extends Asset {
    address: Address | 'TON';
    blockchain: BLOCKCHAIN_NAME.TON;
}

export function jettonToTonAsset(address: string, jettons: JettonsBalances): TonAsset {
    if (address === 'TON') {
        return TON_ASSET;
    }

    const jetton = jettons.balances.find(i => i.metadata?.address === address)!;
    return {
        symbol: jetton.metadata!.symbol,
        decimals: jetton.metadata!.decimals,
        name: jetton.metadata!.name,
        blockchain: BLOCKCHAIN_NAME.TON,
        address: Address.parseRaw(address),
        id: packAssetId(BLOCKCHAIN_NAME.TON, address)
    };
}

export function legacyTonAssetId(tonAsset: TonAsset, options?: { userFriendly?: boolean }): string {
    if (tonAsset.address === 'TON') {
        return 'TON';
    }
    return options?.userFriendly ? tonAsset.address.toString() : tonAsset.address.toRawString();
}
