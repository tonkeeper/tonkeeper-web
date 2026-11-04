/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { BLOCKCHAIN_NAME } from '../../entries/crypto';
import { MultichainWalletAsset } from '../multichainWalletService';
import { parseScannedTransfer, scannedSendForm } from '../multichainScannedTransfer';

const USDT_JETTON = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
const TON_RECIPIENT = 'EQDtR_gykQ0K0W11a0I51m8G_aIC_epBTaLMO7L9aQPfOwzo';
const EVM_RECIPIENT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const TRON_RECIPIENT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const NOW = 1_800_000_000;

const asset = (assetId: string, overrides: Partial<MultichainWalletAsset> = {}) =>
    ({
        assetId,
        chain: 'ton',
        name: 'Asset',
        symbol: 'AST',
        decimals: 9,
        image: '',
        balance: '1000',
        isHidden: false,
        ...overrides
    } as MultichainWalletAsset);

const TON_COIN = asset('ton/mainnet/coin', { symbol: 'TON' });
const TON_USDT = asset(`ton/mainnet/jetton/${USDT_JETTON}`, { symbol: 'USD₮', decimals: 6 });
const ETH_COIN = asset('eth/mainnet/coin', { chain: 'evm', symbol: 'ETH', decimals: 18 });
const BASE_COIN = asset('base/mainnet/coin', { chain: 'evm', symbol: 'ETH', decimals: 18 });
const ETH_USDC = asset(`eth/mainnet/erc20/${USDC_CONTRACT}`, {
    chain: 'evm',
    symbol: 'USDC',
    decimals: 6
});

describe('parseScannedTransfer', () => {
    it('hands a bare address back as text', () => {
        expect(parseScannedTransfer(` ${TON_RECIPIENT} `)).toEqual({
            kind: 'text',
            value: TON_RECIPIENT
        });
        expect(parseScannedTransfer(EVM_RECIPIENT)).toEqual({ kind: 'text', value: EVM_RECIPIENT });
    });

    it('reads a ton:// transfer link', () => {
        expect(
            parseScannedTransfer(`ton://transfer/${TON_RECIPIENT}?amount=1500000000&text=hi`, NOW)
        ).toEqual({
            kind: 'transfer',
            payload: {
                chain: BLOCKCHAIN_NAME.TON,
                address: TON_RECIPIENT,
                amount: '1500000000',
                text: 'hi',
                jetton: undefined,
                from: 'qr-code',
                origin: 'qr_code'
            }
        });
    });

    it('reads tonkeeper:// and universal transfer links with a domain recipient', () => {
        const universal = parseScannedTransfer('https://app.tonkeeper.com/transfer/foo.ton', NOW);
        expect(universal).toMatchObject({ kind: 'transfer', payload: { address: 'foo.ton' } });
        const custom = parseScannedTransfer(`tonkeeper://transfer/${TON_RECIPIENT}`, NOW);
        expect(custom).toMatchObject({ kind: 'transfer', payload: { address: TON_RECIPIENT } });
    });

    it('refuses links carrying a raw payload or state init', () => {
        expect(parseScannedTransfer(`ton://transfer/${TON_RECIPIENT}?bin=te6c`, NOW)).toEqual({
            kind: 'unsupported'
        });
        expect(parseScannedTransfer(`ton://transfer/${TON_RECIPIENT}?init=te6c`, NOW)).toEqual({
            kind: 'unsupported'
        });
    });

    it('flags an expired link', () => {
        expect(
            parseScannedTransfer(`ton://transfer/${TON_RECIPIENT}?exp=${NOW - 60}`, NOW)
        ).toEqual({ kind: 'expired' });
        expect(
            parseScannedTransfer(`ton://transfer/${TON_RECIPIENT}?exp=${NOW + 600}`, NOW).kind
        ).toBe('transfer');
    });

    it('reads a tron: link as a recipient only', () => {
        expect(parseScannedTransfer(`tron:${TRON_RECIPIENT}?amount=5`)).toEqual({
            kind: 'transfer',
            payload: {
                chain: BLOCKCHAIN_NAME.TRON,
                address: TRON_RECIPIENT,
                from: 'qr-code',
                origin: 'qr_code'
            }
        });
    });
});

describe('scannedSendForm', () => {
    it('fills a bare address as scanned', () => {
        expect(scannedSendForm(TON_RECIPIENT, TON_COIN)).toEqual({
            kind: 'form',
            toAddress: TON_RECIPIENT
        });
    });

    it('fills recipient, amount and comment of a TON link on the TON coin', () => {
        expect(
            scannedSendForm(
                `ton://transfer/${TON_RECIPIENT}?amount=1500000000&text=hi`,
                TON_COIN,
                NOW
            )
        ).toEqual({ kind: 'form', toAddress: TON_RECIPIENT, amountDisplay: '1.5', comment: 'hi' });
    });

    it('drops a nanoton amount when a jetton is being sent', () => {
        expect(
            scannedSendForm(`ton://transfer/${TON_RECIPIENT}?amount=1500000000`, TON_USDT, NOW)
        ).toEqual({ kind: 'form', toAddress: TON_RECIPIENT, amountDisplay: undefined });
    });

    it('takes the amount of a jetton link for that jetton', () => {
        expect(
            scannedSendForm(
                `ton://transfer/${TON_RECIPIENT}?jetton=${USDT_JETTON}&amount=2500000`,
                TON_USDT,
                NOW
            )
        ).toMatchObject({ toAddress: TON_RECIPIENT, amountDisplay: '2.5' });
    });

    it('honours an asset_id link only for the asset it names', () => {
        const link = `tonkeeper://transfer/${EVM_RECIPIENT}?asset_id=eth/mainnet/coin&amount=1000000000000000000`;
        expect(scannedSendForm(link, ETH_COIN, NOW)).toMatchObject({
            toAddress: EVM_RECIPIENT,
            amountDisplay: '1'
        });
        expect(scannedSendForm(link, BASE_COIN, NOW)).toMatchObject({
            toAddress: EVM_RECIPIENT,
            amountDisplay: undefined
        });
    });

    it('reads an ERC-681 coin link with a chain id', () => {
        const link = `ethereum:${EVM_RECIPIENT}@1?value=2e18`;
        expect(scannedSendForm(link, ETH_COIN)).toMatchObject({
            toAddress: EVM_RECIPIENT,
            amountDisplay: '2'
        });
        expect(scannedSendForm(link, BASE_COIN)).toMatchObject({
            toAddress: EVM_RECIPIENT,
            amountDisplay: undefined
        });
    });

    it('reads a chainless ERC-681 token transfer against the sent token', () => {
        const link = `ethereum:${USDC_CONTRACT}/transfer?address=${EVM_RECIPIENT}&uint256=3000000`;
        expect(scannedSendForm(link, ETH_USDC)).toMatchObject({
            toAddress: EVM_RECIPIENT,
            amountDisplay: '3'
        });
        expect(scannedSendForm(link, ETH_COIN)).toMatchObject({
            toAddress: EVM_RECIPIENT,
            amountDisplay: undefined
        });
    });

    it('passes expired and unsupported links through', () => {
        expect(
            scannedSendForm(`ton://transfer/${TON_RECIPIENT}?exp=${NOW - 60}`, TON_COIN, NOW)
        ).toEqual({ kind: 'expired' });
        expect(scannedSendForm(`ton://transfer/${TON_RECIPIENT}?bin=te6c`, TON_COIN, NOW)).toEqual({
            kind: 'unsupported'
        });
    });
});
