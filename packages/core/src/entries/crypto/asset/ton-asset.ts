import { Address } from '@ton/core';
import { JettonBalance, JettonsBalances } from '../../../tonApiV2';
import { BLOCKCHAIN_NAME } from '../../crypto';
import { BasicAsset, packAssetId } from './basic-asset';
import { TON_ASSET } from './constants';
import { AssetAmount } from './asset-amount';

export type TonAssetAddress = Address | 'TON';
export function isTon(address: TonAssetAddress): address is 'TON' {
    return address === 'TON';
}

export interface TonAssetIdentification {
    address: Address | 'TON';
    blockchain: BLOCKCHAIN_NAME.TON;
}

export interface TonAsset extends BasicAsset, TonAssetIdentification {}

export function tonAssetAddressToString(address: TonAsset['address']): string {
    return typeof address === 'string' ? address : address.toRawString();
}

export function tonAssetAddressFromString(address: string): TonAsset['address'] {
    return address === 'TON' ? address : Address.parse(address);
}

export function jettonToTonAsset(address: string, jettons: JettonsBalances): TonAsset {
    if (address === 'TON') {
        return TON_ASSET;
    }

    address = Address.parse(address).toRawString();

    const jetton = jettons.balances.find(i => i.jetton.address === address);

    if (!jetton) {
        throw new Error(`Jetton ${address} not found`);
    }

    return {
        symbol: jetton.jetton.symbol,
        decimals: jetton.jetton.decimals,
        name: jetton.jetton.name,
        blockchain: BLOCKCHAIN_NAME.TON,
        address: Address.parseRaw(address),
        id: packAssetId(BLOCKCHAIN_NAME.TON, address),
        image: jetton.jetton.image
    };
}

export function jettonToTonAssetAmount(jetton: JettonBalance): AssetAmount<TonAsset> {
    const asset: TonAsset = {
        symbol: jetton.jetton.symbol,
        decimals: jetton.jetton.decimals,
        name: jetton.jetton.name,
        blockchain: BLOCKCHAIN_NAME.TON,
        address: Address.parseRaw(jetton.jetton.address),
        id: packAssetId(BLOCKCHAIN_NAME.TON, jetton.jetton.address),
        image: jetton.jetton.image
    };

    return new AssetAmount({ weiAmount: jetton.balance, asset, image: jetton.jetton.image });
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
