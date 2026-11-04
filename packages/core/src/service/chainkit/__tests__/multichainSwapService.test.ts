/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, vi } from 'vitest';

import { Address } from '@ton/core';

import {
    CrossSwapAggregator,
    CrossSwapCalldataPayloadType,
    CrossSwapChainFamily,
    CrossSwapHumanSummary,
    CrossSwapPayload,
    CrossSwapPayloadKind,
    CrossSwapPayloadType,
    CrossSwapRiskLevel,
    CrossSwapRoute,
    CrossSwapRouteType,
    CrossSwapValidationStatus
} from '../../../swapsApiGenerated';
import {
    canonicalAssetId,
    isEvmSwapNetwork,
    isSameAssetId,
    isSplitTonSwapRoute,
    isTokenDepositSwapRoute,
    MultichainSwapConfirmation,
    parsableSwapPayloadBody,
    resolveSwapFee,
    swapAssetWalletId,
    swapCoinSpend,
    swapMinimumReceiveAmount,
    swapQuotePayloadInput,
    tonSwapPayloadMessages,
    validateAndOrderMultichainSwapPayloads
} from '../multichainSwapService';
import type { CrossSwapAsset } from '../../../swapsApi/SwapService';

const NOW = Date.parse('2026-07-13T12:00:00.000Z');

const payload = (
    kind: CrossSwapPayload['kind'],
    overrides: Partial<CrossSwapPayload> = {}
): CrossSwapPayload => ({
    payloadId: kind,
    kind,
    chainId: 'eth/mainnet',
    chainFamily: CrossSwapChainFamily.Evm,
    payloadType:
        kind === CrossSwapPayloadKind.Approval
            ? CrossSwapPayloadType.EvmApprovalTx
            : CrossSwapPayloadType.EvmTx,
    payload: '{}',
    humanSummary: {
        action: kind,
        spendAsset: 'eth/mainnet/coin',
        spendAmount: '1',
        receiveAsset: 'btc/mainnet/coin'
    },
    validationStatus: CrossSwapValidationStatus.Validated,
    dateExpire: '2026-07-13T12:01:00.000Z',
    ...overrides
});

const EVM_WALLET = '0x2e1fA1b0C7Dd3A9b6f4C55E8d11Aa9C0b3E7F218';
const SPENDER = '0x1b6257cae4192e62b629efca21771be3d759183d';

const swapAsset = (assetId: string) =>
    ({ assetId, chainId: assetId.split('/').slice(0, 2).join('/') } as CrossSwapAsset);

const route = (overrides: Partial<CrossSwapRoute> = {}): CrossSwapRoute => ({
    routeId: 'route',
    aggregator: CrossSwapAggregator.Swapkit,
    routeType: CrossSwapRouteType.CrossChainSwap,
    sourceAmount: '1',
    estimatedDestinationAmount: '100',
    minimumDestinationAmount: '90',
    legs: [],
    dateExpire: '2026-07-13T12:01:00.000Z',
    riskLevel: CrossSwapRiskLevel.Low,
    ...overrides
});

const confirmation = (
    payloads: CrossSwapPayload[],
    overrides: Partial<MultichainSwapConfirmation> = {}
): MultichainSwapConfirmation => ({
    sourceAsset: swapAsset('eth/mainnet/coin'),
    destinationAsset: swapAsset('btc/mainnet/coin'),
    destinationAddress: 'bc1qwallet',
    prepared: { routeId: 'route', aggregator: CrossSwapAggregator.Swapkit, payloads },
    route: route(),
    unlimitedApproval: false,
    ...overrides
});

const tokenApproval = (summary: Partial<CrossSwapHumanSummary> = {}): CrossSwapPayload =>
    payload(CrossSwapPayloadKind.Approval, {
        humanSummary: {
            action: 'approve',
            spendAsset: 'eth/mainnet/erc20/0xdAC17F958D2ee523a2206206994597C13D831ec7',
            spendAmount: '20000000',
            receiveAsset: 'eth/mainnet/coin',
            approvalSpender: SPENDER,
            approvalAmount: '20000000',
            ...summary
        }
    });

const tokenMain = payload(CrossSwapPayloadKind.Main, {
    humanSummary: {
        action: 'swap',
        spendAsset: 'eth/mainnet/erc20/0xdAC17F958D2ee523a2206206994597C13D831ec7',
        spendAmount: '20000000',
        receiveAsset: 'eth/mainnet/coin',
        receiveAmount: '7922811535025828'
    }
});

const tokenSwap = (
    approval: CrossSwapPayload,
    overrides: Partial<MultichainSwapConfirmation> = {}
): MultichainSwapConfirmation =>
    confirmation([tokenMain, approval], {
        sourceAsset: swapAsset('eth/mainnet/token/0xdac17f958d2ee523a2206206994597c13d831ec7'),
        destinationAsset: swapAsset('eth/mainnet/coin'),
        destinationAddress: EVM_WALLET,
        route: route({
            sourceAmount: '20000000',
            minimumDestinationAmount: '7843583419675569'
        }),
        ...overrides
    });

describe('validateAndOrderMultichainSwapPayloads', () => {
    it('orders token approval before the main swap payload', () => {
        expect(
            validateAndOrderMultichainSwapPayloads(tokenSwap(tokenApproval()), NOW).map(
                item => item.kind
            )
        ).toEqual([CrossSwapPayloadKind.Approval, CrossSwapPayloadKind.Main]);
    });

    it('rejects payloads that expired before signing', () => {
        const expired = payload(CrossSwapPayloadKind.Main, {
            dateExpire: '2026-07-13T11:59:59.000Z'
        });

        expect(() => validateAndOrderMultichainSwapPayloads(confirmation([expired]), NOW)).toThrow(
            'has expired'
        );
    });

    it('rejects unvalidated or wrong-chain payloads', () => {
        const pending = payload(CrossSwapPayloadKind.Main, {
            validationStatus: CrossSwapValidationStatus.Pending
        });
        const wrongChain = payload(CrossSwapPayloadKind.Main, { chainId: 'ton/mainnet' });

        expect(() => validateAndOrderMultichainSwapPayloads(confirmation([pending]), NOW)).toThrow(
            'is not validated'
        );
        expect(() =>
            validateAndOrderMultichainSwapPayloads(confirmation([wrongChain]), NOW)
        ).toThrow('targets the wrong chain');
    });

    it('requires a main payload', () => {
        expect(() =>
            validateAndOrderMultichainSwapPayloads(
                tokenSwap(tokenApproval(), {
                    prepared: {
                        routeId: 'route',
                        aggregator: CrossSwapAggregator.Swapkit,
                        payloads: [tokenApproval()]
                    }
                }),
                NOW
            )
        ).toThrow('has no main payload');
    });
});

describe('payloads held to the confirmed route', () => {
    const main = (summary: Partial<CrossSwapHumanSummary>) =>
        payload(CrossSwapPayloadKind.Main, {
            humanSummary: { ...payload(CrossSwapPayloadKind.Main).humanSummary, ...summary }
        });
    const check = (swap: MultichainSwapConfirmation) => () =>
        validateAndOrderMultichainSwapPayloads(swap, NOW);

    it('accepts a summary in either backend spelling of the pair', () => {
        expect(check(tokenSwap(tokenApproval()))).not.toThrow();
    });

    it('rejects a prepare from another aggregator', () => {
        expect(
            check(
                confirmation([main({})], {
                    route: route({ aggregator: CrossSwapAggregator.Swapsxyz })
                })
            )
        ).toThrow('another aggregator');
    });

    it('rejects another pair', () => {
        expect(check(confirmation([main({ spendAsset: 'base/mainnet/coin' })]))).toThrow(
            'spends another asset'
        );
        expect(check(confirmation([main({ receiveAsset: 'tron/mainnet/coin' })]))).toThrow(
            'receives another asset'
        );
    });

    it('accepts an approval with no receive asset, but not one naming another', () => {
        expect(check(tokenSwap(tokenApproval({ receiveAsset: '' })))).not.toThrow();
        expect(check(tokenSwap(tokenApproval({ receiveAsset: 'tron/mainnet/coin' })))).toThrow(
            'receives another asset'
        );
    });

    it('accepts amounts the backend reports inconsistently with the route', () => {
        expect(check(confirmation([main({ spendAmount: '125' })]))).not.toThrow();
        expect(check(confirmation([main({ receiveAmount: '89' })]))).not.toThrow();
    });

    it('fails an approval on a missing quoted spend', () => {
        expect(
            check(tokenSwap(tokenApproval(), { route: route({ sourceAmount: undefined }) }))
        ).toThrow('no valid quoted source amount');
    });

    it('requires the wallet as recipient when the summary names one', () => {
        expect(check(confirmation([main({ recipientAddress: 'bc1qother' })]))).toThrow(
            'another recipient'
        );
        expect(check(confirmation([main({ recipientAddress: 'bc1qwallet' })]))).not.toThrow();
    });

    it('compares TON recipients across address forms', () => {
        const wallet = Address.parse('UQCe6OZlNFHXWBai5V3CzYsdO68yZR2GMdMYWO6NJ1wYi5PA');
        const tonMain = main({
            receiveAsset: 'ton/mainnet/coin',
            recipientAddress: wallet.toString({ bounceable: false })
        });
        expect(
            check(
                confirmation([tonMain], {
                    destinationAsset: swapAsset('ton/mainnet/coin'),
                    destinationAddress: wallet.toRawString()
                })
            )
        ).not.toThrow();
    });

    it('bounds an approval by the quoted spend unless unlimited was asked for', () => {
        const max = tokenApproval({ approvalAmount: (2n ** 256n - 1n).toString() });
        expect(check(tokenSwap(max))).toThrow('approves more');
        expect(check(tokenSwap(max, { unlimitedApproval: true }))).not.toThrow();
    });

    it('requires an approval amount and spender', () => {
        expect(check(tokenSwap(tokenApproval({ approvalAmount: undefined })))).toThrow(
            'no valid approval amount'
        );
        expect(check(tokenSwap(tokenApproval({ approvalSpender: undefined })))).toThrow(
            'no approval spender'
        );
    });

    it('holds a re-prepared approval to the spender the quote named', () => {
        const quoted = tokenSwap(tokenApproval());
        const reprepared = tokenSwap(tokenApproval({ approvalSpender: EVM_WALLET }), {
            route: { ...quoted.route, payloads: [tokenMain, tokenApproval()] }
        });
        expect(check(reprepared)).toThrow('approves another spender');
    });

    it('rejects an approval on a chain-coin swap', () => {
        expect(
            check(
                confirmation([
                    main({}),
                    tokenApproval({
                        spendAsset: 'eth/mainnet/coin',
                        spendAmount: '1',
                        receiveAsset: 'btc/mainnet/coin',
                        approvalAmount: '1'
                    })
                ])
            )
        ).toThrow('approves a chain coin');
    });
});

describe('bnb / bsc network aliasing', () => {
    it('reads a legacy bnb asset id as the bsc one', () => {
        expect(
            swapAssetWalletId('bnb/mainnet/bep20/0x55d398326f99059ff775485246999027b3197955')
        ).toBe('bsc/mainnet/bep20/0x55d398326f99059ff775485246999027b3197955');
        expect(swapAssetWalletId('eth/mainnet/coin')).toBe('eth/mainnet/coin');
    });

    it('treats bnb as an EVM network alongside the chain-kit codes', () => {
        expect(isEvmSwapNetwork('bnb')).toBe(true);
        expect(isEvmSwapNetwork('bsc')).toBe(true);
        expect(isEvmSwapNetwork('ton')).toBe(false);
        expect(isEvmSwapNetwork('btc')).toBe(false);
    });
});

describe('canonicalAssetId', () => {
    it('lowercases EVM addresses and keeps the token type as minted', () => {
        expect(
            canonicalAssetId('eth/mainnet/erc20/0xdAC17F958D2ee523a2206206994597C13D831ec7')
        ).toBe('eth/mainnet/erc20/0xdac17f958d2ee523a2206206994597c13d831ec7');
        expect(
            canonicalAssetId('bsc/mainnet/bep20/0x55d398326f99059ff775485246999027b3197955')
        ).toBe('bsc/mainnet/bep20/0x55d398326f99059ff775485246999027b3197955');
    });

    it('spells TON jettons with a raw address', () => {
        expect(
            canonicalAssetId('ton/mainnet/jetton/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs')
        ).toBe(
            'ton/mainnet/jetton/0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe'
        );
    });

    it('keeps the case of Tron addresses', () => {
        expect(canonicalAssetId('tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')).toBe(
            'tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
        );
    });

    it('reads the bnb network code as bsc', () => {
        expect(canonicalAssetId('bnb/mainnet/coin')).toBe('bsc/mainnet/coin');
    });

    it('leaves coins and unparseable ids untouched', () => {
        expect(canonicalAssetId('ton/mainnet/coin')).toBe('ton/mainnet/coin');
        expect(canonicalAssetId('ton/mainnet/jetton/notanaddress')).toBe(
            'ton/mainnet/jetton/notanaddress'
        );
        expect(canonicalAssetId('ton/mainnet/stocks/0:abc')).toBe('ton/mainnet/stocks/0:abc');
    });
});

describe('isSameAssetId', () => {
    it('matches a wallet id against the lowercased Tron id the on-ramp echoes', () => {
        expect(
            isSameAssetId(
                'tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                'tron/mainnet/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t'
            )
        ).toBe(true);
    });

    it('matches checksummed and friendly spellings of the same asset', () => {
        expect(
            isSameAssetId(
                'eth/mainnet/erc20/0xdAC17F958D2ee523a2206206994597C13D831ec7',
                'eth/mainnet/erc20/0xdac17f958d2ee523a2206206994597c13d831ec7'
            )
        ).toBe(true);
        expect(
            isSameAssetId(
                'ton/mainnet/jetton/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
                'ton/mainnet/jetton/0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe'
            )
        ).toBe(true);
    });

    it('matches a token type spelled `token` against the minted one', () => {
        expect(isSameAssetId('eth/mainnet/token/0xabc', 'eth/mainnet/erc20/0xABC')).toBe(true);
    });

    it('tells different assets apart', () => {
        expect(isSameAssetId('eth/mainnet/coin', 'base/mainnet/coin')).toBe(false);
        expect(
            isSameAssetId(
                'tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                'tron/mainnet/coin'
            )
        ).toBe(false);
    });
});

describe('swapCoinSpend', () => {
    const asset = (assetId: string) =>
        ({ assetId, chainId: assetId.split('/').slice(0, 2).join('/') } as CrossSwapAsset);
    const tonMain = payload(CrossSwapPayloadKind.Main, {
        chainId: 'ton/mainnet',
        chainFamily: CrossSwapChainFamily.Ton,
        payloadType: CrossSwapPayloadType.TonBoc,
        payload: JSON.stringify([{ address: 'EQrouter', amount: '1300000000' }])
    });
    const evmMain = payload(CrossSwapPayloadKind.Main, {
        payload: JSON.stringify({ to: '0xrouter', value: '0x2386f26fc10000' })
    });

    it('reads the message value of a TON leg, gas included', () => {
        expect(swapCoinSpend(asset('ton/mainnet/coin'), [tonMain])).toBe(1300000000n);
        expect(swapCoinSpend(asset('ton/mainnet/jetton/0:abc'), [tonMain])).toBe(1300000000n);
    });

    it('reads the native value of an EVM call, for token sources too', () => {
        const approval = payload(CrossSwapPayloadKind.Approval);
        expect(swapCoinSpend(asset('eth/mainnet/coin'), [approval, evmMain])).toBe(
            10000000000000000n
        );
        expect(swapCoinSpend(asset('eth/mainnet/token/0xabc'), [evmMain])).toBe(10000000000000000n);
    });

    it('uses the spend amount for other chain coins and skips their tokens', () => {
        const tronMain = payload(CrossSwapPayloadKind.Main, {
            chainId: 'tron/mainnet',
            humanSummary: { ...evmMain.humanSummary, spendAmount: '5000000' }
        });
        expect(swapCoinSpend(asset('tron/mainnet/coin'), [tronMain])).toBe(5000000n);
        expect(swapCoinSpend(asset('tron/mainnet/trc20/TXabc'), [tronMain])).toBeUndefined();
        expect(swapCoinSpend(asset('ton/mainnet/coin'), undefined)).toBeUndefined();
    });
});

const ROUTER_JETTON_WALLET = 'EQC9bXRVHLtdjSa4EOcLlD8pNKhNWLeRGLFF0nNTDfl13uwH';
const TON_DEPOSIT = 'UQCe6OZlNFHXWBai5V3CzYsdO68yZR2GMdMYWO6NJ1wYi5PA';

const tonPayload = (overrides: Partial<CrossSwapPayload> = {}): CrossSwapPayload =>
    payload(CrossSwapPayloadKind.Main, {
        chainId: 'ton/mainnet',
        chainFamily: CrossSwapChainFamily.Ton,
        payloadType: CrossSwapPayloadType.TonBoc,
        humanSummary: {
            action: 'Swap on TON',
            spendAsset: 'ton/mainnet/coin',
            spendAmount: '775000000',
            receiveAsset: 'ton/mainnet/jetton/0:abc',
            depositAddress: TON_DEPOSIT
        },
        ...overrides
    });

const splitEnvelope = [
    { address: ROUTER_JETTON_WALLET, amount: '185000000', payload: 'te6cckEBAgEAAQ==' },
    { address: ROUTER_JETTON_WALLET, amount: '330000000', payload: 'te6cckEBAgEAAg==' },
    { address: ROUTER_JETTON_WALLET, amount: '260000000', payload: 'te6cckEBAgEAAw==' }
];

describe('tonSwapPayloadMessages', () => {
    it('keeps every message of a split route, in order', () => {
        const messages = tonSwapPayloadMessages(
            tonPayload({ payload: JSON.stringify(splitEnvelope) })
        );
        expect(messages).toEqual(splitEnvelope);
    });

    it('lets a lone message lean on the human summary', () => {
        expect(tonSwapPayloadMessages(tonPayload({ payload: '[{}]' }))).toEqual([
            { address: TON_DEPOSIT, amount: '775000000', payload: undefined }
        ]);
        expect(tonSwapPayloadMessages(tonPayload({ payload: 'null' }))).toEqual([
            { address: TON_DEPOSIT, amount: '775000000', payload: undefined }
        ]);
    });

    it('never fills a part of a split route from the summary of the whole', () => {
        const envelope = [splitEnvelope[0], { address: ROUTER_JETTON_WALLET }];
        expect(() =>
            tonSwapPayloadMessages(tonPayload({ payload: JSON.stringify(envelope) }))
        ).toThrow('has a message with no amount');
    });

    it('reads the to / value / data spelling of a message', () => {
        const message = { to: ROUTER_JETTON_WALLET, value: '185000000', data: 'te6cc' };
        expect(
            tonSwapPayloadMessages(tonPayload({ payload: JSON.stringify([message, message]) }))
        ).toEqual([
            { address: ROUTER_JETTON_WALLET, amount: '185000000', payload: 'te6cc' },
            { address: ROUTER_JETTON_WALLET, amount: '185000000', payload: 'te6cc' }
        ]);
    });

    it('reads a SwapKit deposit descriptor as the message it describes', () => {
        const deposit = tonPayload({
            payloadType: CrossSwapPayloadType.AltVmDeposit,
            payload: `{"amount":"50000000","to":"${TON_DEPOSIT}"}`
        });
        expect(tonSwapPayloadMessages(deposit)).toEqual([
            { address: TON_DEPOSIT, amount: '50000000', payload: undefined }
        ]);

        const withCalldata = tonPayload({
            payloadType: CrossSwapPayloadType.AltVmDeposit,
            payload: `{"amount":"50000000","to":"${TON_DEPOSIT}","payload":"te6ccg"}`
        });
        expect(tonSwapPayloadMessages(withCalldata)[0].payload).toBe('te6ccg');
    });

    it('rejects a ton_boc payload that is not a list of messages', () => {
        expect(() =>
            tonSwapPayloadMessages(
                tonPayload({ payload: `{"address":"${TON_DEPOSIT}","amount":"1000000000"}` })
            )
        ).toThrow('is not a list of TON messages');
    });
});

describe('parsableSwapPayloadBody', () => {
    const deposit = (chainId: string, body: string) =>
        payload(CrossSwapPayloadKind.Main, {
            chainId,
            payloadType: CrossSwapPayloadType.AltVmDeposit,
            payload: body
        });

    it('wraps a TON deposit descriptor into an envelope and leaves an envelope alone', () => {
        expect(
            parsableSwapPayloadBody(deposit('ton/mainnet', '{"amount":"1","to":"UQ"}'), 'ton')
        ).toEqual([{ amount: '1', to: 'UQ' }]);
        expect(
            parsableSwapPayloadBody(deposit('ton/mainnet', '[{"amount":"1","to":"UQ"}]'), 'ton')
        ).toEqual([{ amount: '1', to: 'UQ' }]);
    });

    it('names an EVM deposit amount the way a transaction does', () => {
        for (const network of ['eth', 'base', 'arb', 'bsc'] as const) {
            expect(
                parsableSwapPayloadBody(
                    deposit(`${network}/mainnet`, '{"amount":"42","to":"0x1"}'),
                    network
                )
            ).toEqual({ amount: '42', to: '0x1', value: '42' });
            expect(
                parsableSwapPayloadBody(
                    deposit(`${network}/mainnet`, '{"value":"42","amount":"7","to":"0x1"}'),
                    network
                )
            ).toEqual({ value: '42', amount: '7', to: '0x1' });
        }
    });

    it('translates only the deposit descriptor, and only on TON and EVM', () => {
        const descriptor = '{"amount":"1","to":"T"}';
        expect(parsableSwapPayloadBody(deposit('tron/mainnet', descriptor), 'tron')).toEqual({
            amount: '1',
            to: 'T'
        });
        expect(
            parsableSwapPayloadBody(
                payload(CrossSwapPayloadKind.Main, { payload: '{"amount":"42","to":"0x1"}' }),
                'eth'
            )
        ).toEqual({ amount: '42', to: '0x1' });
    });
});

describe('isSplitTonSwapRoute', () => {
    const prepared = (main: CrossSwapPayload) => ({
        routeId: 'route',
        aggregator: CrossSwapAggregator.Omniston,
        payloads: [main]
    });

    it('is true only for a TON main leg of several messages', () => {
        expect(
            isSplitTonSwapRoute(prepared(tonPayload({ payload: JSON.stringify(splitEnvelope) })))
        ).toBe(true);
        expect(
            isSplitTonSwapRoute(
                prepared(tonPayload({ payload: JSON.stringify([splitEnvelope[0]]) }))
            )
        ).toBe(false);
        expect(isSplitTonSwapRoute(prepared(payload(CrossSwapPayloadKind.Main)))).toBe(false);
        expect(isSplitTonSwapRoute(prepared(tonPayload({ payload: 'not json' })))).toBe(false);
    });
});

describe('deposit descriptors and coin spend', () => {
    const asset = (assetId: string) =>
        ({ assetId, chainId: assetId.split('/').slice(0, 2).join('/') } as CrossSwapAsset);

    it('sums every message of a split TON route', () => {
        const split = tonPayload({ payload: JSON.stringify(splitEnvelope) });
        expect(swapCoinSpend(asset('ton/mainnet/coin'), [split])).toBe(775000000n);
    });

    it('reads a coin deposit descriptor amount as the coin it spends', () => {
        const tonDeposit = tonPayload({
            payloadType: CrossSwapPayloadType.AltVmDeposit,
            payload: `{"amount":"50000000","to":"${TON_DEPOSIT}"}`
        });
        const evmDeposit = payload(CrossSwapPayloadKind.Main, {
            payloadType: CrossSwapPayloadType.AltVmDeposit,
            payload: '{"amount":"50000000","to":"0xF90Fcfc48e36d1214B1854Ce91EE1E5D06Eb6e9B"}'
        });
        expect(swapCoinSpend(asset('ton/mainnet/coin'), [tonDeposit])).toBe(50000000n);
        expect(swapCoinSpend(asset('eth/mainnet/coin'), [evmDeposit])).toBe(50000000n);
    });

    it('leaves a token deposit descriptor out of the coin spend', () => {
        const tonDeposit = tonPayload({
            payloadType: CrossSwapPayloadType.AltVmDeposit,
            payload: `{"amount":"50000000","to":"${TON_DEPOSIT}"}`
        });
        const jetton = asset('ton/mainnet/jetton/0:abc');
        expect(isTokenDepositSwapRoute(jetton, [tonDeposit])).toBe(true);
        expect(isTokenDepositSwapRoute(asset('ton/mainnet/coin'), [tonDeposit])).toBe(false);
        expect(isTokenDepositSwapRoute(jetton, [tonPayload({ payload: '[]' })])).toBe(false);
        expect(swapCoinSpend(jetton, [tonDeposit])).toBeUndefined();
    });
});

describe('swapMinimumReceiveAmount', () => {
    const main = (minimumReceiveAmount?: string) =>
        payload(CrossSwapPayloadKind.Main, {
            humanSummary: {
                ...payload(CrossSwapPayloadKind.Main).humanSummary,
                minimumReceiveAmount
            }
        });

    it('prefers the minimum reported when the transaction was built', () => {
        expect(swapMinimumReceiveAmount(route(), [tokenApproval(), main('85')])).toBe('85');
    });

    it('falls back to the quoted minimum when the build reports none', () => {
        expect(swapMinimumReceiveAmount(route(), [main()])).toBe('90');
        expect(swapMinimumReceiveAmount(route(), undefined)).toBe('90');
    });

    it('ignores a malformed built minimum', () => {
        expect(swapMinimumReceiveAmount(route(), [main('8.5')])).toBe('90');
    });
});

describe('swapQuotePayloadInput', () => {
    const BTC_DEPOSIT = 'bc1qdeposit';
    const btcMain = (overrides: Partial<CrossSwapPayload> = {}) =>
        payload(CrossSwapPayloadKind.Main, {
            chainId: 'btc/mainnet',
            chainFamily: CrossSwapChainFamily.Utxo,
            payloadType: CrossSwapPayloadType.UtxoPsbt,
            payload: `{"to":"${BTC_DEPOSIT}","value":"1568","memo":"=:ton.usdt"}`,
            humanSummary: {
                action: 'swap',
                spendAsset: 'btc/mainnet/coin',
                spendAmount: '1568',
                receiveAsset: 'ton/mainnet/jetton/0:abc',
                depositAddress: ` ${BTC_DEPOSIT} `
            },
            ...overrides
        });

    it('hands a swaps.xyz BTC leg to the parser as a flex transfer', () => {
        expect(swapQuotePayloadInput(btcMain(), CrossSwapAggregator.Swapsxyz, 'btc')).toEqual({
            provider: 'SwapXyz',
            type: 'Flex',
            payload: `{"to":"${BTC_DEPOSIT}","value":"1568","memo":"=:ton.usdt"}`,
            depositAddress: BTC_DEPOSIT,
            spendAmount: '1568'
        });
    });

    it('keeps the backend calldata type over the fallback', () => {
        const exact = btcMain({ calldataPayloadType: CrossSwapCalldataPayloadType.Exact });
        expect(swapQuotePayloadInput(exact, CrossSwapAggregator.Swapsxyz, 'btc').type).toBe(
            'Exact'
        );
    });

    it('treats a SwapKit PSBT or TRON transaction as exact', () => {
        expect(swapQuotePayloadInput(btcMain(), CrossSwapAggregator.Swapkit, 'btc').type).toBe(
            'Exact'
        );
        const tron = btcMain({ chainId: 'tron/mainnet', payloadType: CrossSwapPayloadType.TronTx });
        expect(swapQuotePayloadInput(tron, CrossSwapAggregator.Swapkit, 'tron').type).toBe('Exact');
    });

    it('signs Omniston routes as swaps.xyz and refuses an unknown aggregator', () => {
        const ton = tonPayload();
        expect(swapQuotePayloadInput(ton, CrossSwapAggregator.Omniston, 'ton')).toMatchObject({
            provider: 'SwapXyz',
            type: 'Exact'
        });
        expect(() => swapQuotePayloadInput(ton, 'unknown', 'ton')).toThrow(
            'Unsupported swap aggregator'
        );
    });

    it('assumes flex only for an EVM leg it can rebuild', () => {
        const router = payload(CrossSwapPayloadKind.Main, {
            payload: '{"to":"0xrouter","value":"0","data":"0x38ed1739"}'
        });
        const plain = payload(CrossSwapPayloadKind.Main, {
            payload: '{"to":"0xdeposit","value":"10","data":"0x"}'
        });
        expect(swapQuotePayloadInput(router, CrossSwapAggregator.Swapkit, 'eth').type).toBe(
            'Exact'
        );
        expect(swapQuotePayloadInput(plain, CrossSwapAggregator.Swapkit, 'eth').type).toBe('Flex');
        expect(swapQuotePayloadInput(router, CrossSwapAggregator.Swapsxyz, 'eth').type).toBe(
            'Flex'
        );
        expect(
            swapQuotePayloadInput(
                payload(CrossSwapPayloadKind.Approval),
                CrossSwapAggregator.Swapsxyz,
                'eth'
            ).type
        ).toBe('Exact');
    });

    it('translates a deposit descriptor into the shape the parser reads', () => {
        const evmDeposit = payload(CrossSwapPayloadKind.Main, {
            payloadType: CrossSwapPayloadType.AltVmDeposit,
            payload: '{"amount":"50","to":"0xdeposit"}'
        });
        const input = swapQuotePayloadInput(evmDeposit, CrossSwapAggregator.Swapkit, 'eth');
        expect(input.type).toBe('Flex');
        expect(JSON.parse(input.payload)).toEqual({ amount: '50', to: '0xdeposit', value: '50' });

        const tonDeposit = tonPayload({
            payloadType: CrossSwapPayloadType.AltVmDeposit,
            payload: `{"amount":"50","to":"${TON_DEPOSIT}"}`
        });
        expect(
            JSON.parse(
                swapQuotePayloadInput(tonDeposit, CrossSwapAggregator.Swapkit, 'ton').payload
            )
        ).toEqual([{ amount: '50', to: TON_DEPOSIT }]);
    });
});

describe('resolveSwapFee', () => {
    const ok = <T>(value: T) => ({ value, error: null, isOk: true, isErr: false });
    const err = (error: Error) => ({ value: null, error, isOk: false, isErr: true });
    const transaction = {} as Parameters<typeof resolveSwapFee>[1];
    const fee = { amount: 10n } as unknown as Parameters<typeof resolveSwapFee>[2];
    const mediator = (calculated: unknown, fallback: unknown) =>
        ({
            fee: {
                calculateFee: vi.fn().mockResolvedValue(calculated),
                getDefaultFee: vi.fn().mockResolvedValue(fallback)
            }
        } as unknown as Parameters<typeof resolveSwapFee>[0]);

    it('falls back to the default fee as an unestimated one', async () => {
        await expect(
            resolveSwapFee(mediator(err(new Error('estimate')), ok(fee)), transaction)
        ).resolves.toEqual({ fee, estimated: false });
    });

    it('reports the estimate failure when the chain has no default fee', async () => {
        const shortage = new Error('insufficient inputs');
        await expect(
            resolveSwapFee(mediator(err(shortage), err(new Error('not implemented'))), transaction)
        ).rejects.toBe(shortage);
    });
});
