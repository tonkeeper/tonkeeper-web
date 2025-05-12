import { BLOCKCHAIN_NAME } from '../../crypto';
import { packAssetId } from './basic-asset';
import { TonAsset } from './ton-asset';
import { TronAsset } from './tron-asset';
import { Address } from '@ton/core';
import { JettonVerificationType } from "../../../tonApiV2";

const usdtAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

export const TRON_USDT_ASSET: TronAsset = {
    id: packAssetId(BLOCKCHAIN_NAME.TRON, usdtAddress),
    symbol: 'USDT',
    name: 'Tether USDT',
    decimals: 6,
    address: usdtAddress,
    blockchain: BLOCKCHAIN_NAME.TRON,
    image: 'https://wallet.tonkeeper.com/img/usdt-trc20.png'
};

export const TRON_TRX_ASSET: TronAsset = {
    id: packAssetId(BLOCKCHAIN_NAME.TRON, 'TRX'),
    symbol: 'TRX',
    name: 'TRX',
    decimals: 6,
    address: 'TRX',
    blockchain: BLOCKCHAIN_NAME.TRON,
    image: 'https://wallet.tonkeeper.com/img/trx.svg'
};

export const TON_ASSET: TonAsset = {
    id: packAssetId(BLOCKCHAIN_NAME.TON, 'TON'),
    symbol: 'TON',
    name: 'Ton Coin',
    decimals: 9,
    address: 'TON',
    blockchain: BLOCKCHAIN_NAME.TON,
    image: 'https://wallet.tonkeeper.com/img/toncoin.svg',
    verification: JettonVerificationType.Whitelist
};

export const TON_USDT_ASSET: TonAsset = {
    id: packAssetId(
        BLOCKCHAIN_NAME.TON,
        Address.parse('0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe')
    ),
    symbol: 'USD₮',
    name: 'Tether USD',
    decimals: 6,
    address: Address.parse('0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe'),
    blockchain: BLOCKCHAIN_NAME.TON,
    image: 'https://cache.tonapi.io/imgproxy/T3PB4s7oprNVaJkwqbGg54nexKE0zzKhcrPv8jcWYzU/rs:fill:200:200:1/g:no/aHR0cHM6Ly90ZXRoZXIudG8vaW1hZ2VzL2xvZ29DaXJjbGUucG5n.webp',
    verification: JettonVerificationType.Whitelist
};

export const KNOWN_TON_ASSETS = {
    jUSDT: Address.parse('EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA')
};
