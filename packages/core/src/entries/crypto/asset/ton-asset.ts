import { Address } from '@ton/core';
import {
    Account,
    ExtraCurrency,
    JettonBalance,
    JettonsBalances,
    JettonVerificationType
} from '../../../tonApiV2';
import { BLOCKCHAIN_NAME } from '../../crypto';
import { BasicAsset, packAssetId } from './basic-asset';
import { TON_ASSET, TON_USDT_ASSET } from './constants';
import { AssetAmount } from './asset-amount';
import { TronAsset } from './tron-asset';
import { seeIfValidTonAddress } from '../../../utils/common';

export type TonAssetAddress = TonAsset['address'];
export function isTon(address: TonAssetAddress): address is 'TON' {
    return address === 'TON';
}

export interface TonMainAsset {
    address: 'TON';
    blockchain: BLOCKCHAIN_NAME.TON;
}

export interface TonExtraCurrencyAsset {
    address: string;
    blockchain: BLOCKCHAIN_NAME.TON;
}

export interface TonJettonAsset {
    address: Address;
    blockchain: BLOCKCHAIN_NAME.TON;
}

export type TonAssetIdentification = TonMainAsset | TonExtraCurrencyAsset | TonJettonAsset;

export type TonAsset = BasicAsset &
    TonAssetIdentification & { verification: JettonVerificationType };

export function tonAssetAddressToString(address: TonAsset['address']): string {
    return typeof address === 'string' ? address : address.toRawString();
}

export function tonAssetAddressFromString(address: string): TonAsset['address'] {
    return seeIfValidTonAddress(address) ? Address.parse(address) : address;
}

export function assetAddressToString(address: TonAsset['address'] | TronAsset['address']): string {
    return typeof address === 'string' ? address : address.toRawString();
}

export function extraBalanceToTonAsset(extraBalance: ExtraCurrency): TonAsset {
    return {
        id: String(extraBalance.preview.id),
        symbol: extraBalance.preview.symbol,
        name: extraBalance.preview.symbol,
        decimals: extraBalance.preview.decimals,
        address: extraBalance.preview.symbol,
        blockchain: BLOCKCHAIN_NAME.TON,
        image: extraBalance.preview.image,
        verification: JettonVerificationType.None
    };
}

export function tokenToTonAsset(
    token: string,
    info: Account | undefined,
    jettons: JettonsBalances
): TonAsset {
    if (token === 'TON') {
        return TON_ASSET;
    }

    if (seeIfValidTonAddress(token)) {
        return jettonToTonAsset(token, jettons);
    }

    const extra = info?.extraBalance?.find(item => item.preview.symbol === token);
    if (!extra) {
        throw new Error(`Extra currency ${extra} not found`);
    }
    return extraBalanceToTonAsset(extra);
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
        image: jetton.jetton.image,
        noImageCorners: shouldHideTonJettonImageCorners(jetton.jetton.address),
        verification: jetton.jetton.verification
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
        image: jetton.jetton.image,
        noImageCorners: shouldHideTonJettonImageCorners(jetton.jetton.address),
        verification: jetton.jetton.verification
    };

    return new AssetAmount({ weiAmount: jetton.balance, asset, image: jetton.jetton.image });
}

export function shouldHideTonJettonImageCorners(address: string): boolean {
    if (address === TON_ASSET.address) {
        return false;
    }

    try {
        return Address.parse(address).equals(
            Address.parse(tonAssetAddressToString(TON_USDT_ASSET.address))
        );
    } catch {
        return true;
    }
}

export function legacyTonAssetId(
    tonAsset: TonAssetIdentification,
    options?: { userFriendly?: boolean }
): string {
    if (tonAsset.address === 'TON') {
        return 'TON';
    }
    if (Address.isAddress(tonAsset.address)) {
        return options?.userFriendly ? tonAsset.address.toString() : tonAsset.address.toRawString();
    } else {
        return tonAsset.address;
    }
}
