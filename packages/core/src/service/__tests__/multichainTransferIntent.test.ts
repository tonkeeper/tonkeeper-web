/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { BLOCKCHAIN_NAME } from '../../entries/crypto';
import { MultichainWalletAsset } from '../multichainWalletService';
import { resolveMultichainTransferIntent } from '../multichainTransferIntent';

const USDT_JETTON_RAW = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';
const USDT_JETTON_FRIENDLY = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

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

const TON_RECIPIENT = 'EQDtR_gykQ0K0W11a0I51m8G_aIC_epBTaLMO7L9aQPfOwzo';
const EVM_RECIPIENT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

const TON_COIN = asset('ton/mainnet/coin', { symbol: 'TON', decimals: 9 });
const TON_USDT = asset(`ton/mainnet/jetton/${USDT_JETTON_FRIENDLY}`, {
    symbol: 'USD₮',
    decimals: 6
});
const TRON_COIN = asset('tron/mainnet/coin', { chain: 'tron', symbol: 'TRX', decimals: 6 });
const TRON_USDT = asset('tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', {
    chain: 'tron',
    symbol: 'USDT',
    decimals: 6
});

describe('resolveMultichainTransferIntent', () => {
    it('pins the native coin for a TON payload with an amount — nanotons denominate it', () => {
        const result = resolveMultichainTransferIntent(
            {
                chain: BLOCKCHAIN_NAME.TON,
                from: 'qr-code',
                address: TON_RECIPIENT,
                amount: '1500000000',
                text: 'for coffee'
            },
            [TON_USDT, TON_COIN, TRON_COIN]
        );

        expect(result.asset).toBe(TON_COIN);
        expect(result.assetUnavailable).toBe(false);
        expect(result.pickerNetworks).toBeUndefined();
        expect(result.form).toEqual({
            toAddress: TON_RECIPIENT,
            amountDisplay: '1.5',
            comment: 'for coffee'
        });
    });

    it('opens the picker scoped to TON for an address-only TON payload', () => {
        const result = resolveMultichainTransferIntent(
            {
                chain: BLOCKCHAIN_NAME.TON,
                from: 'qr-code',
                address: TON_RECIPIENT,
                text: 'for coffee'
            },
            [TON_USDT, TON_COIN, TRON_COIN]
        );

        // Nothing pins an asset: which one a bare address means is the user's call.
        expect(result.asset).toBeUndefined();
        expect(result.assetUnavailable).toBe(false);
        expect(result.pickerNetworks).toEqual(['ton']);
        expect(result.form).toEqual({
            toAddress: TON_RECIPIENT,
            comment: 'for coffee'
        });
    });

    it('falls back to the picker when the TON amount is unreadable or non-positive', () => {
        for (const amount of ['0', 'lots']) {
            const result = resolveMultichainTransferIntent(
                {
                    chain: BLOCKCHAIN_NAME.TON,
                    from: 'qr-code',
                    address: TON_RECIPIENT,
                    amount
                },
                [TON_USDT, TON_COIN]
            );
            expect(result.asset).toBeUndefined();
            expect(result.pickerNetworks).toEqual(['ton']);
            expect(result.form.amountDisplay).toBeUndefined();
        }
    });

    it('pre-selects the native TON coin for a payload with no address (programmatic open)', () => {
        const result = resolveMultichainTransferIntent(
            { chain: BLOCKCHAIN_NAME.TON, from: 'wallet' },
            [TON_USDT, TON_COIN]
        );

        expect(result.asset).toBe(TON_COIN);
        expect(result.assetUnavailable).toBe(false);
    });

    it('matches a jetton across equivalent TON address forms', () => {
        const result = resolveMultichainTransferIntent(
            { chain: BLOCKCHAIN_NAME.TON, from: 'qr-code', jetton: USDT_JETTON_RAW },
            [TON_COIN, TON_USDT]
        );

        expect(result.asset).toBe(TON_USDT);
        expect(result.assetUnavailable).toBe(false);
    });

    it('converts the amount with the resolved jetton decimals, not the coin decimals', () => {
        const result = resolveMultichainTransferIntent(
            {
                chain: BLOCKCHAIN_NAME.TON,
                from: 'qr-code',
                jetton: USDT_JETTON_FRIENDLY,
                amount: '2500000'
            },
            [TON_COIN, TON_USDT]
        );

        expect(result.form.amountDisplay).toBe('2.5');
    });

    it('reports an unavailable asset for a jetton the wallet does not hold', () => {
        const result = resolveMultichainTransferIntent(
            {
                chain: BLOCKCHAIN_NAME.TON,
                from: 'qr-code',
                address: 'UQAAAA',
                jetton: USDT_JETTON_RAW,
                amount: '2500000'
            },
            [TON_COIN]
        );

        expect(result.asset).toBeUndefined();
        expect(result.assetUnavailable).toBe(true);
        expect(result.form.toAddress).toBe('UQAAAA');
        // Without an asset there are no decimals to convert against.
        expect(result.form.amountDisplay).toBeUndefined();
    });

    it('drops an unreadable or non-positive amount but keeps the address', () => {
        const zero = resolveMultichainTransferIntent(
            {
                chain: BLOCKCHAIN_NAME.TON,
                from: 'qr-code',
                address: 'UQAAAA',
                jetton: USDT_JETTON_FRIENDLY,
                amount: '0'
            },
            [TON_COIN, TON_USDT]
        );
        expect(zero.form).toEqual({
            toAddress: 'UQAAAA',
            amountDisplay: undefined,
            comment: undefined
        });

        const garbage = resolveMultichainTransferIntent(
            {
                chain: BLOCKCHAIN_NAME.TON,
                from: 'qr-code',
                address: 'UQAAAA',
                jetton: USDT_JETTON_FRIENDLY,
                amount: 'lots'
            },
            [TON_COIN, TON_USDT]
        );
        expect(garbage.form.amountDisplay).toBeUndefined();
    });

    it('prefers the TRC-20 Tether for a TRON payload', () => {
        const result = resolveMultichainTransferIntent(
            { chain: BLOCKCHAIN_NAME.TRON, from: 'qr-code', address: 'TXYZ' },
            [TRON_COIN, TRON_USDT, TON_COIN]
        );

        expect(result.asset).toBe(TRON_USDT);
        expect(result.form).toEqual({ toAddress: 'TXYZ' });
    });

    it('ignores a TRC-20 that only shares the USDT ticker', () => {
        const lookalike = asset('tron/mainnet/trc20/TLookalikeContractAddress000000000', {
            chain: 'tron',
            symbol: 'USDT',
            decimals: 6
        });
        const result = resolveMultichainTransferIntent(
            { chain: BLOCKCHAIN_NAME.TRON, from: 'qr-code', address: 'TXYZ' },
            [lookalike, TRON_COIN]
        );

        expect(result.asset).toBe(TRON_COIN);
    });

    it('falls back to native TRX when the wallet holds no TRC-20 Tether', () => {
        const result = resolveMultichainTransferIntent(
            { chain: BLOCKCHAIN_NAME.TRON, from: 'qr-code', address: 'TXYZ' },
            [TRON_COIN, TON_COIN]
        );

        expect(result.asset).toBe(TRON_COIN);
        expect(result.assetUnavailable).toBe(false);
    });

    it('reports an unavailable asset when the wallet holds nothing on Tron', () => {
        const result = resolveMultichainTransferIntent(
            { chain: BLOCKCHAIN_NAME.TRON, from: 'qr-code', address: 'TXYZ' },
            [TON_COIN]
        );

        expect(result.asset).toBeUndefined();
        expect(result.assetUnavailable).toBe(true);
    });

    it('carries no asset or prefill for a chainless payload', () => {
        const result = resolveMultichainTransferIntent({}, [TON_COIN]);

        expect(result.asset).toBeUndefined();
        expect(result.assetUnavailable).toBe(false);
        expect(result.form).toEqual({});
    });

    describe('assetId payloads', () => {
        const ETH_USDC = asset('eth/mainnet/erc20/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', {
            chain: 'evm',
            symbol: 'USDC',
            decimals: 6
        });

        it('matches an EVM token regardless of the 0x address casing and drops the comment', () => {
            const result = resolveMultichainTransferIntent(
                {
                    assetId: 'eth/mainnet/erc20/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    from: 'qr-code',
                    address: EVM_RECIPIENT,
                    amount: '2500000',
                    text: 'not an evm memo'
                },
                [TON_COIN, ETH_USDC]
            );

            expect(result.asset).toBe(ETH_USDC);
            expect(result.assetUnavailable).toBe(false);
            expect(result.form).toEqual({
                toAddress: EVM_RECIPIENT,
                amountDisplay: '2.5',
                comment: undefined
            });
        });

        it('matches a TON jetton across equivalent address forms and keeps the comment', () => {
            const result = resolveMultichainTransferIntent(
                {
                    assetId: `ton/mainnet/jetton/${USDT_JETTON_RAW}`,
                    from: 'qr-code',
                    address: TON_RECIPIENT,
                    amount: '1000000',
                    text: 'for coffee'
                },
                [TON_COIN, TON_USDT]
            );

            expect(result.asset).toBe(TON_USDT);
            expect(result.form.amountDisplay).toBe('1');
            expect(result.form.comment).toBe('for coffee');
        });

        it('reports an unavailable asset but keeps the address', () => {
            const result = resolveMultichainTransferIntent(
                {
                    assetId: 'sol/mainnet/coin',
                    from: 'qr-code',
                    address: 'So1RecipientAddress',
                    amount: '1000000000'
                },
                [TON_COIN, TRON_COIN, TRON_USDT]
            );

            expect(result.asset).toBeUndefined();
            expect(result.assetUnavailable).toBe(true);
            expect(result.form.toAddress).toBe('So1RecipientAddress');
            expect(result.form.amountDisplay).toBeUndefined();
        });

        it('drops a pinned asset the recipient cannot receive, along with its amount', () => {
            const result = resolveMultichainTransferIntent(
                {
                    assetId: TRON_USDT.assetId,
                    from: 'qr-code',
                    address: TON_RECIPIENT,
                    amount: '5000000'
                },
                [TON_COIN, TON_USDT, TRON_USDT]
            );

            expect(result.asset).toBeUndefined();
            expect(result.assetUnavailable).toBe(false);
            expect(result.pickerNetworks).toEqual(['ton']);
            expect(result.form).toEqual({ toAddress: TON_RECIPIENT });
        });
    });

    describe('erc20Contract payloads (ERC-681 without a chain id)', () => {
        const CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
        const ETH_USDC = asset(`eth/mainnet/erc20/${CONTRACT}`, {
            chain: 'evm',
            symbol: 'USDC',
            decimals: 6
        });
        const BASE_USDC = asset(`base/mainnet/erc20/${CONTRACT.toLowerCase()}`, {
            chain: 'evm',
            symbol: 'USDC',
            decimals: 6
        });
        const ETH_COIN = asset('eth/mainnet/coin', {
            chain: 'evm',
            symbol: 'ETH',
            decimals: 18
        });

        it('prefills the form when the contract matches exactly one wallet asset', () => {
            const result = resolveMultichainTransferIntent(
                {
                    erc20Contract: CONTRACT.toLowerCase(),
                    from: 'qr-code',
                    address: EVM_RECIPIENT,
                    amount: '2500000'
                },
                [TON_COIN, ETH_COIN, ETH_USDC]
            );

            expect(result.asset).toBe(ETH_USDC);
            expect(result.form.amountDisplay).toBe('2.5');
        });

        it('scopes the picker to the matched networks when several assets share the contract', () => {
            const result = resolveMultichainTransferIntent(
                {
                    erc20Contract: CONTRACT,
                    from: 'qr-code',
                    address: EVM_RECIPIENT,
                    amount: '2500000'
                },
                [ETH_USDC, BASE_USDC, ETH_COIN]
            );

            expect(result.asset).toBeUndefined();
            expect(result.assetUnavailable).toBe(false);
            expect(result.pickerNetworks).toEqual(['eth', 'base']);
            expect(result.form).toEqual({ toAddress: EVM_RECIPIENT });
        });

        it('falls back to the recipient-scoped picker when nothing matches', () => {
            const result = resolveMultichainTransferIntent(
                { erc20Contract: CONTRACT, from: 'qr-code', address: EVM_RECIPIENT },
                [TON_COIN, ETH_COIN]
            );

            expect(result.asset).toBeUndefined();
            expect(result.assetUnavailable).toBe(false);
            expect(result.pickerNetworks).toEqual(['eth']);
        });
    });

    it('a recipient-only payload scopes the picker to the chains the address is valid on', () => {
        const ETH_COIN = asset('eth/mainnet/coin', { chain: 'evm', symbol: 'ETH', decimals: 18 });
        const result = resolveMultichainTransferIntent(
            { from: 'qr-code', address: EVM_RECIPIENT },
            [TON_COIN, TRON_COIN, ETH_COIN]
        );

        expect(result.asset).toBeUndefined();
        expect(result.pickerNetworks).toEqual(['eth']);
        expect(result.form).toEqual({ toAddress: EVM_RECIPIENT });
    });
});
