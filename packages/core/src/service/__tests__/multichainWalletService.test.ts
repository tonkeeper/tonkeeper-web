/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, vi } from 'vitest';

import BigNumber from 'bignumber.js';

import { WalletVersion } from '../../entries/wallet';
import {
    getMultichainWalletAsset,
    getMultichainWalletAssets,
    getOwnMultichainWalletAssets,
    isForeignAccountAsset,
    isPlaceholderTokenImage,
    MultichainApiHttpError,
    multichainOwnedAccountTypes,
    multichainOwnedAccountTypesForTonVersions,
    MultichainWalletAsset,
    tonAccountType,
    totalFiatWithoutForeignAccounts
} from '../multichainWalletService';

describe('isPlaceholderTokenImage', () => {
    it('recognises the backend placeholder both raw and behind imgproxy', () => {
        expect(isPlaceholderTokenImage('https://tonkeeper.com/assets/tokens/Placeholder.png')).toBe(
            true
        );
        expect(
            isPlaceholderTokenImage(
                'https://cache.tonapi.io/imgproxy/Cduo7mlzIv6IWeoUuaZXw7hae4qCMOi3USW0vC8MODI/rs:fill:200:200:1/g:no/aHR0cHM6Ly90b25rZWVwZXIuY29tL2Fzc2V0cy90b2tlbnMvUGxhY2Vob2xkZXIucG5n.webp'
            )
        ).toBe(true);
    });

    it('passes real token images and empty values through', () => {
        expect(
            isPlaceholderTokenImage(
                'https://cache.tonapi.io/imgproxy/abc/rs:fill:200:200:1/g:no/aHR0cHM6Ly9leGFtcGxlLmNvbS91c2R0LnBuZw.webp'
            )
        ).toBe(false);
        expect(isPlaceholderTokenImage('')).toBe(false);
        expect(isPlaceholderTokenImage(undefined)).toBe(false);
    });
});

function makeFetch(status: number, body: unknown): typeof fetch {
    return vi.fn(async () => {
        return {
            ok: status >= 200 && status < 300,
            status,
            statusText: 'STATUS',
            json: async () => body
        } as Response;
    }) as unknown as typeof fetch;
}

describe('getMultichainWalletAssets', () => {
    const sampleResponse = {
        assets: [
            {
                asset: {
                    asset_id: 'ton/mainnet/coin',
                    name: 'Ton Coin',
                    symbol: 'TON',
                    decimals: 9,
                    image: 'https://example/ton.svg'
                },
                price: {
                    prices: { USD: 1.84 },
                    diff_24h: { USD: '+7.32%' }
                },
                is_hidden: false,
                balance: '2345000000000'
            },
            {
                asset: {
                    asset_id: 'eth/mainnet/coin',
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18,
                    image: 'https://example/eth.svg',
                    verification: 'trusted'
                },
                price: {
                    prices: { USD: 2069.87 },
                    diff_24h: { USD: '+0.05%' }
                },
                is_hidden: false,
                balance: '560000000000000000'
            },
            {
                asset: {
                    asset_id: 'unsupported/whatever',
                    name: 'Mystery',
                    symbol: 'XYZ',
                    decimals: 0,
                    image: ''
                },
                is_hidden: false,
                balance: '0'
            }
        ],
        fiat_price: { USD: '1.0' },
        next_cursor: ''
    };

    it('maps the raw response into MultichainWalletAsset rows and drops unknown chains', async () => {
        const fetchImpl = makeFetch(200, sampleResponse);
        const res = await getMultichainWalletAssets({
            walletId: 'a'.repeat(64),
            currency: 'USD',
            fetchImpl
        });

        expect(res.assets).toHaveLength(2);
        expect(res.assets[0]).toMatchObject({
            chain: 'ton',
            symbol: 'TON',
            balance: '2345000000000',
            diff24h: '+7.32%'
        });
        expect(res.assets[0].price?.toString()).toBe('1.84');
        expect(res.assets[1]).toMatchObject({
            chain: 'evm',
            symbol: 'ETH',
            balance: '560000000000000000',
            diff24h: '+0.05%',
            verification: 'trusted'
        });
    });

    it('never promotes a missing or unknown verification past "none"', async () => {
        const fetchImpl = makeFetch(200, {
            assets: [
                { ...sampleResponse.assets[0] },
                {
                    ...sampleResponse.assets[1],
                    asset: { ...sampleResponse.assets[1].asset, verification: 'verified' }
                }
            ],
            fiat_price: {},
            next_cursor: ''
        });
        const res = await getMultichainWalletAssets({
            walletId: 'a'.repeat(64),
            currency: 'USD',
            fetchImpl
        });

        expect(res.assets.map(a => a.verification)).toEqual(['none', 'none']);
    });

    it('builds the correct URL with cursor and chain filter', async () => {
        const fetchImpl = vi.fn(async () => {
            return {
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => ({ assets: [], fiat_price: {}, next_cursor: '' })
            } as Response;
        }) as unknown as typeof fetch;
        await getMultichainWalletAssets({
            walletId: 'wallet-xyz',
            currency: 'EUR',
            chain: 'eth',
            limit: 25,
            cursor: 'page-2',
            availableOnly: true,
            fetchImpl
        });
        const url = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(url).toContain('/wallets/wallet-xyz/assets?');
        expect(url).toContain('currencies=eur');
        expect(url).toContain('chain=eth');
        expect(url).toContain('limit=25');
        expect(url).toContain('cursor=page-2');
        expect(url).toContain('available_only=true');
    });

    it('sends hide_dust only when the filter is on', async () => {
        const fetchImpl = vi.fn(async () => {
            return {
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => ({ assets: [], fiat_price: {}, next_cursor: '' })
            } as Response;
        }) as unknown as typeof fetch;

        await getMultichainWalletAssets({
            walletId: 'w',
            currency: 'USD',
            hideDust: true,
            fetchImpl
        });
        await getMultichainWalletAssets({
            walletId: 'w',
            currency: 'USD',
            hideDust: false,
            fetchImpl
        });
        const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
        expect(calls[0][0]).toContain('hide_dust=true');
        // `false` is the backend default and travels as omission.
        expect(calls[1][0]).not.toContain('hide_dust');
    });

    it('throws a status-carrying error on non-2xx response', async () => {
        const fetchImpl = makeFetch(404, { error: 'not found' });
        const error = await getMultichainWalletAssets({
            walletId: 'unknown',
            currency: 'USD',
            fetchImpl
        }).catch(e => e);
        expect(error).toBeInstanceOf(MultichainApiHttpError);
        expect(error.status).toBe(404);
        expect(error.message).toMatch(/404/);
    });
});

describe('getMultichainWalletAsset', () => {
    it('resolves to undefined when the wallet has no such asset', async () => {
        const asset = await getMultichainWalletAsset({
            walletId: 'w1',
            currency: 'USD',
            assetId: 'eth/mainnet/erc20/0xdead',
            fetchImpl: makeFetch(404, { error: 'not found' })
        });
        expect(asset).toBeUndefined();
    });

    it('throws a status-carrying error on other non-2xx responses', async () => {
        const error = await getMultichainWalletAsset({
            walletId: 'w1',
            currency: 'USD',
            assetId: 'eth/mainnet/erc20/not-an-address',
            fetchImpl: makeFetch(400, { error: 'bad asset id' })
        }).catch(e => e);
        expect(error).toBeInstanceOf(MultichainApiHttpError);
        expect(error.status).toBe(400);
    });
});

describe('account ownership of asset rows', () => {
    const row = (
        chain: MultichainWalletAsset['chain'],
        accountType: string | undefined,
        balance = '1000000000',
        price: number | null = 2
    ): MultichainWalletAsset => ({
        assetId: `${chain}/mainnet/coin`,
        chain,
        name: chain,
        symbol: chain.toUpperCase(),
        decimals: 9,
        image: '',
        verification: 'trusted',
        balance,
        isHidden: false,
        price: price === null ? undefined : new BigNumber(price),
        accountAddress: '0:0',
        accountType
    });

    it('names TON versions the way the register call does', () => {
        expect(tonAccountType(WalletVersion.V4R2)).toBe('v4R2');
        expect(tonAccountType(WalletVersion.V5R1)).toBe('v5R1');
    });

    it('owns only the active TON version and segwit Bitcoin', () => {
        expect(
            multichainOwnedAccountTypes({ activeTonWallet: { version: WalletVersion.V5R1 } })
        ).toEqual({ ton: ['v5R1'], btc: ['p2wpkh'] });
    });

    it('owns every listed TON version when several accounts of a seed are summed', () => {
        expect(
            multichainOwnedAccountTypesForTonVersions([WalletVersion.V4R2, WalletVersion.V5R1])
        ).toEqual({ ton: ['v4R2', 'v5R1'], btc: ['p2wpkh'] });
    });

    it('flags the other TON version as foreign and keeps everything else', () => {
        const owned = multichainOwnedAccountTypes({
            activeTonWallet: { version: WalletVersion.V5R1 }
        });
        expect(isForeignAccountAsset(row('ton', 'v4R2'), owned)).toBe(true);
        expect(isForeignAccountAsset(row('ton', 'v5R1'), owned)).toBe(false);
        expect(isForeignAccountAsset(row('ton', undefined), owned)).toBe(false);
        expect(isForeignAccountAsset(row('evm', undefined), owned)).toBe(false);
        expect(isForeignAccountAsset(row('tron', 'anything'), owned)).toBe(false);
    });

    it('keeps the backend total when nothing was dropped', () => {
        const own = [row('ton', 'v5R1')];
        expect(totalFiatWithoutForeignAccounts(new BigNumber(10), own, []).toString()).toBe('10');
    });

    it('subtracts the value of dropped rows from the backend total', () => {
        const own = [row('ton', 'v5R1', '153000000')];
        const foreign = [row('ton', 'v4R2', '1290000000', 1.5)];
        expect(totalFiatWithoutForeignAccounts(new BigNumber(2.2), own, foreign).toString()).toBe(
            '0.265'
        );
    });

    it('falls back to summing the kept rows when a dropped row has no price', () => {
        const own = [row('ton', 'v5R1', '2000000000', 3)];
        const foreign = [row('ton', 'v4R2', '1000000000', null)];
        expect(totalFiatWithoutForeignAccounts(new BigNumber(9), own, foreign).toString()).toBe(
            '6'
        );
        expect(totalFiatWithoutForeignAccounts(undefined, own, foreign).toString()).toBe('6');
    });

    it('carries the account address and type off the response row', async () => {
        const fetchImpl = makeFetch(200, {
            assets: [
                {
                    asset: {
                        asset_id: 'ton/mainnet/coin',
                        name: 'Toncoin',
                        symbol: 'TON',
                        decimals: 9,
                        image: ''
                    },
                    address: 'UQabc',
                    type: 'v4R2',
                    price: { prices: { USD: 1 } },
                    is_hidden: false,
                    balance: '1'
                }
            ],
            fiat_price: {},
            next_cursor: ''
        });
        const res = await getMultichainWalletAssets({ walletId: 'w1', currency: 'USD', fetchImpl });
        expect(res.assets[0]).toMatchObject({ accountAddress: 'UQabc', accountType: 'v4R2' });
    });
});

describe('getOwnMultichainWalletAssets', () => {
    const tonRow = (type: string, balance: string) => ({
        asset: {
            asset_id: 'ton/mainnet/coin',
            name: 'Toncoin',
            symbol: 'TON',
            decimals: 9,
            image: ''
        },
        address: `UQ${type}`,
        type,
        price: { prices: { USD: 2 } },
        is_hidden: false,
        balance
    });
    const ethRow = {
        asset: {
            asset_id: 'eth/mainnet/coin',
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
            image: ''
        },
        address: '0xabc',
        price: { prices: { USD: 1000 } },
        is_hidden: false,
        balance: '1000000000000000000'
    };

    it('follows the cursor, drops the other TON version and takes its value off the total', async () => {
        const pages = [
            {
                assets: [tonRow('v4R2', '1290000000'), ethRow],
                fiat_price: { USD: '1002.886' },
                next_cursor: 'p2'
            },
            { assets: [tonRow('v5R1', '153000000')], fiat_price: { USD: '0.306' }, next_cursor: '' }
        ];
        const fetchImpl = vi.fn(async () => ({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => pages.shift()
        })) as unknown as typeof fetch;

        const res = await getOwnMultichainWalletAssets({
            walletId: 'w1',
            ownedAccountTypes: { ton: ['v5R1'] },
            currency: 'USD',
            fetchImpl
        });

        expect(fetchImpl).toHaveBeenCalledTimes(2);
        expect(res.assets.map(a => [a.assetId, a.accountType, a.balance])).toEqual([
            ['eth/mainnet/coin', undefined, '1000000000000000000'],
            ['ton/mainnet/coin', 'v5R1', '153000000']
        ]);
        expect(res.totalFiat.toString()).toBe('1000.306');
    });

    it('drops an own zero-balance row that is only visible because the other version holds it', async () => {
        const usdt = (type: string, balance: string) => ({
            asset: {
                asset_id: 'ton/mainnet/jetton/0:usdt',
                name: 'Tether',
                symbol: 'USDT',
                decimals: 6,
                image: ''
            },
            address: `UQ${type}`,
            type,
            price: { prices: { USD: 1 } },
            is_hidden: false,
            balance
        });
        const fetchImpl = makeFetch(200, {
            assets: [
                usdt('v4R2', '5000000'),
                usdt('v5R1', '0'),
                tonRow('v5R1', '0'),
                tonRow('v4R2', '0')
            ],
            fiat_price: { USD: '5' },
            next_cursor: ''
        });

        const res = await getOwnMultichainWalletAssets({
            walletId: 'w1',
            ownedAccountTypes: { ton: ['v5R1'] },
            currency: 'USD',
            fetchImpl
        });

        // The zero GRAM row stays: the other version holds nothing either,
        // so its visibility is this account's own.
        expect(res.assets.map(a => [a.assetId, a.balance])).toEqual([['ton/mainnet/coin', '0']]);
        expect(res.totalFiat.toString()).toBe('0');
    });
});
