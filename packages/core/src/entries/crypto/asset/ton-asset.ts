import { Address } from 'ton-core';
import { JettonsBalances } from '../../../tonApiV1';
import { BLOCKCHAIN_NAME } from '../../crypto';
import { BasicAsset, packAssetId } from './basic-asset';
import { TON_ASSET } from './constants';

export interface TonAssetIdentification {
    address: Address | 'TON';
    blockchain: BLOCKCHAIN_NAME.TON;
}

export interface TonAsset extends BasicAsset, TonAssetIdentification {}

export function jettonToTonAsset(address: string, jettons: JettonsBalances): TonAsset {
    if (address === 'TON') {
        return TON_ASSET;
    }

    address = Address.parse(address).toRawString();

    const jetton = jettons.balances.find(i => i.metadata?.address === address);

    if (!jetton) {
        throw new Error(`Jetton ${address} not found`);
    }

    return {
        symbol: jetton.metadata!.symbol,
        decimals: jetton.metadata!.decimals,
        name: jetton.metadata!.name,
        blockchain: BLOCKCHAIN_NAME.TON,
        address: Address.parseRaw(address),
        id: packAssetId(BLOCKCHAIN_NAME.TON, address)
    };
}

export function legacyTonAssetId(
    tonAsset: TonAssetIdentification,
    options?: { userFriendly?: boolean }
): string {
    if (tonAsset.address === 'TON') {
        return 'TON';
    }
    return options?.userFriendly ? tonAsset.address.toString() : tonAsset.address.toRawString();
}
