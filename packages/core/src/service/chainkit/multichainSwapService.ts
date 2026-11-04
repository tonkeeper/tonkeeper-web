import { Address } from '@ton/core';
import type {
    Account,
    Asset,
    Chain,
    ChainMediator,
    CryptoWallet,
    Fee,
    TokenType,
    Transaction
} from '@tonkeeper/chainkit';
import { chainkit } from '../../chains/chainkitLoader';

import type { CrossSwapPayload, CrossSwapPrepare, CrossSwapRoute } from '../../swapsApiGenerated';
import type { CrossSwapAsset } from '../../swapsApi/SwapService';
import {
    CrossSwapAggregator,
    CrossSwapCalldataPayloadType,
    CrossSwapPayloadKind,
    CrossSwapPayloadType,
    CrossSwapValidationStatus
} from '../../swapsApiGenerated';
import { unwrap } from '../../chains/result';
import {
    ChainKitNetwork,
    chainKitChainOf,
    chainKitToken,
    getChainKitMediator,
    getChainKitTransactionHelper,
    isSupportedChainKitNetwork
} from './chainKitClient';

const TOKEN_TYPE: Record<string, () => TokenType> = {
    erc20: () => chainkit().TokenType.Erc20,
    'erc-20': () => chainkit().TokenType.Erc20,
    bep20: () => chainkit().TokenType.Bep20,
    trc20: () => chainkit().TokenType.Trc20,
    trc10: () => chainkit().TokenType.Trc10,
    jetton: () => chainkit().TokenType.Jetton
};

export interface MultichainSwapWalletAddresses {
    ton: string;
    evm: string;
    btc: string;
    tron: string;
}

export interface MultichainSwapEstimation {
    feeAmount: bigint;
    feeDecimals: number;
    feeSymbol: string;
    hasApproval: boolean;
    /**
     * False when chain-kit could not estimate at least one leg and the
     * chain's flat default fee stands in for it. The default is a ceiling,
     * not a quote — typically several times the real cost — so callers must
     * not present it as the fee; it is only good for telling a wallet that
     * can't cover any fee apart from a swap that can't be estimated.
     */
    estimated: boolean;
    /**
     * chain-kit's gas reserve found that the live balance can't cover the
     * main leg's amount plus its fee.
     */
    reserveInsufficient: boolean;
}

/** A prepared swap together with the route and options the user confirmed it under. */
export interface MultichainSwapConfirmation {
    sourceAsset: CrossSwapAsset;
    destinationAsset: CrossSwapAsset;
    /** The wallet's own address on the destination chain. */
    destinationAddress: string;
    prepared: CrossSwapPrepare;
    route: CrossSwapRoute;
    unlimitedApproval: boolean;
}

export interface MultichainSwapExecutionInput extends MultichainSwapConfirmation {
    sourceAddress: string;
    /** The amount is the MAX fill, which chain-kit may trim to leave room for the fee. */
    isMax?: boolean;
}

/**
 * Every backend now mints `bsc` for the BNB Smart Chain; `bnb` is still
 * accepted on input so an id from an older payload maps onto chain-kit's code.
 */
const SWAP_NETWORK_ALIASES: Record<string, string> = { bnb: 'bsc' };

const normalizeSwapNetwork = (network: string): string => SWAP_NETWORK_ALIASES[network] ?? network;

const networkOf = (chainId: string): ChainKitNetwork => {
    const network = normalizeSwapNetwork(chainId.split('/')[0]);
    if (!isSupportedChainKitNetwork(network)) {
        throw new Error(`Unsupported swap network: ${network}`);
    }
    return network;
};

export const isChainKitSwapAsset = (asset: CrossSwapAsset): boolean => {
    const network = normalizeSwapNetwork(asset.chainId.split('/')[0]);
    return isSupportedChainKitNetwork(network);
};

/**
 * The wallets backend id for a swap asset, with a legacy `bnb/...` network
 * read as `bsc/...`. Use it to look up balances and prices of a
 * `CrossSwapAsset` in the multichain portfolio.
 */
export const swapAssetWalletId = (assetId: string): string => {
    const [network, ...rest] = assetId.split('/');
    return [normalizeSwapNetwork(network), ...rest].join('/');
};

/**
 * An asset id in the spelling every Tonkeeper backend mints and accepts:
 * `bsc/mainnet/bep20/0x55d3…` with a lowercase EVM address and
 * `ton/mainnet/jetton/0:…` with a raw TON address. Ids built on the client
 * can carry a checksummed or friendly address, which the swaps backend
 * answers with 404.
 */
export const canonicalAssetId = (assetId: string): string => {
    const [network = '', net = '', type = '', ...rest] = assetId.split('/');
    const chain = normalizeSwapNetwork(network);
    let address = rest.join('/');
    if (chain === 'ton' && address) {
        try {
            address = Address.parse(address).toRawString();
        } catch {
            // Not an address this client can parse — keep the producer's spelling.
        }
    } else if (address.startsWith('0x')) {
        address = address.toLowerCase();
    }
    return [chain, net, type, address].filter(Boolean).join('/');
};

const TOKEN_TYPE_SPELLINGS: ReadonlySet<string> = new Set([
    'token',
    'erc20',
    'erc-20',
    'bep20',
    'trc20',
    'trc10'
]);

/**
 * Whether two ids name the same asset. Comparison only — never sent to a
 * backend. The on-ramp and off-ramp endpoints echo Tron addresses lowercased,
 * and the token type is matched loosely so a payload summary spelled `token`
 * still matches the catalog's `erc20`.
 */
export const isSameAssetId = (a: string, b: string): boolean => {
    const key = (assetId: string) => {
        const [chain = '', net = '', type = '', ...rest] = canonicalAssetId(assetId).split('/');
        const kind = TOKEN_TYPE_SPELLINGS.has(type) ? 'token' : type;
        const address = chain === 'tron' ? rest.join('/').toLowerCase() : rest.join('/');
        return [chain, net, kind, address].filter(Boolean).join('/');
    };
    return key(a) === key(b);
};

const EVM_SWAP_NETWORKS: ReadonlySet<string> = new Set(['eth', 'base', 'bsc', 'arb']);

export const isEvmSwapNetwork = (network: string): boolean =>
    EVM_SWAP_NETWORKS.has(normalizeSwapNetwork(network));

export const swapWalletAddress = (
    chainId: string,
    addresses: MultichainSwapWalletAddresses
): string => {
    const network = networkOf(chainId);
    if (network === 'ton') return addresses.ton;
    if (network === 'btc') return addresses.btc;
    if (network === 'tron') return addresses.tron;
    return addresses.evm;
};

const normalizedTokenType = (network: ChainKitNetwork, type: string): string => {
    if (type !== 'token') return type;
    if (network === 'ton') return 'jetton';
    if (network === 'tron') return 'trc20';
    return 'erc20';
};

const buildAsset = (asset: CrossSwapAsset, chain: Chain): Asset => {
    const [, , typeRaw = '', contract = ''] = asset.assetId.split('/');
    const network = networkOf(asset.chainId);
    if (typeRaw === 'coin') {
        return chainkit().Asset.Coin.Companion.of(chain);
    }
    if (!contract) throw new Error(`Swap asset ${asset.assetId} has no contract`);
    const type = normalizedTokenType(network, typeRaw);
    const tokenType = TOKEN_TYPE[type]?.();
    if (!tokenType) throw new Error(`Unsupported swap token type: ${type}`);
    return chainKitToken({
        id: asset.assetId,
        chain,
        symbol: asset.symbol,
        name: asset.name,
        decimals: asset.decimals,
        contract,
        tokenType
    });
};

const parseQuantity = (value: string | undefined, fallback = 0n): bigint => {
    if (!value) return fallback;
    try {
        return BigInt(value);
    } catch {
        throw new Error(`Invalid swap quantity: ${value}`);
    }
};

interface EvmPayload {
    value?: string;
}

/**
 * A TON message as aggregators spell it: the schema names the fields
 * `address`, `amount` and `payload`, some providers send `to`, `value` and
 * `data` instead.
 */
interface TonPayload {
    address?: string;
    to?: string;
    amount?: string | number;
    value?: string | number;
    payload?: string;
    data?: string;
}

const parseJson = <T>(value: string): T => {
    try {
        return JSON.parse(value) as T;
    } catch {
        throw new Error('Prepared swap payload is not valid JSON');
    }
};

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The JSON body of a leg, in the shape the parsers below read. SwapKit
 * answers `alt_vm_deposit` with the bare deposit descriptor —
 * `{"amount": …, "to": …}` — where swaps.xyz answers the same payload type
 * in the shape every other payload has: on TON an array of messages, on EVM
 * a transaction whose amount is `value`. Only that payload type is
 * translated: the schema fixes the shape of every other one, and repairing
 * those here would hide a backend that broke its own contract.
 */
export const parsableSwapPayloadBody = (
    payload: CrossSwapPayload,
    network: ChainKitNetwork
): unknown => {
    const body = parseJson<unknown>(payload.payload);
    if (payload.payloadType !== CrossSwapPayloadType.AltVmDeposit || !isJsonObject(body)) {
        return body;
    }
    if (network === 'ton') return [body];
    if (isEvmSwapNetwork(network) && body.value === undefined && body.amount !== undefined) {
        return { ...body, value: body.amount };
    }
    return body;
};

export interface TonSwapMessage {
    address: string;
    /** Base units the message moves: nanotons, or the jetton for a jetton deposit descriptor. */
    amount: string;
    /** Serialized message body, when the leg carries one. */
    payload?: string;
}

/**
 * The wallet messages of a TON leg, shipped as a JSON array of
 * `{ address, amount, payload }`. A lone message may lean on the human
 * summary for its destination and amount. A route split over several
 * messages may not: the summary's deposit address and spend amount describe
 * the whole route, never one of its parts.
 */
export const tonSwapPayloadMessages = (payload: CrossSwapPayload): TonSwapMessage[] => {
    const body = parsableSwapPayloadBody(payload, 'ton');
    if (body !== null && !Array.isArray(body)) {
        throw new Error(`Swap payload ${payload.payloadId} is not a list of TON messages`);
    }
    const listed = (body ?? []) as TonPayload[];
    const items: TonPayload[] = listed.length > 0 ? listed : [{}];
    const summary = items.length > 1 ? undefined : payload.humanSummary;
    return items.map(item => {
        const address = item.address ?? item.to ?? summary?.depositAddress;
        if (!address) throw new Error(`Swap payload ${payload.payloadId} has no destination`);
        const amount = item.amount ?? item.value ?? summary?.spendAmount;
        if (amount === undefined) {
            throw new Error(`Swap payload ${payload.payloadId} has a message with no amount`);
        }
        return {
            address,
            amount: String(amount),
            payload: item.payload || item.data || undefined
        };
    });
};

const mainPayloadOf = (payloads: CrossSwapPayload[] | undefined): CrossSwapPayload | undefined =>
    payloads?.find(payload => payload.kind === CrossSwapPayloadKind.Main);

/**
 * The quote's minimum is only an estimate: the aggregator may reprice when
 * it builds the transaction, so the main leg's figure is the binding one.
 */
export const swapMinimumReceiveAmount = (
    route: CrossSwapRoute,
    payloads: CrossSwapPayload[] | undefined
): string => {
    const built = mainPayloadOf(payloads)?.humanSummary.minimumReceiveAmount;
    return built !== undefined && /^\d+$/.test(built) ? built : route.minimumDestinationAmount;
};

/**
 * A TON route whose main leg is split over several wallet messages, as
 * Omniston answers a larger swap spread across pools. chain-kit signs one
 * message per transaction, so such a route has to be signed as one wallet
 * transaction by the TON wallet sender; sending only its first message
 * would swap an arbitrary share of the amount.
 */
export const isSplitTonSwapRoute = (prepared: CrossSwapPrepare): boolean => {
    const main = mainPayloadOf(prepared.payloads);
    if (!main || normalizeSwapNetwork(main.chainId.split('/')[0]) !== 'ton') return false;
    try {
        return tonSwapPayloadMessages(main).length > 1;
    } catch {
        return false;
    }
};

/**
 * A token-source route whose main leg is a deposit descriptor: its amount is
 * the token to transfer to the deposit address, not chain coin attached to a
 * message, so the leg is a token transfer that only chain-kit builds.
 */
export const isTokenDepositSwapRoute = (
    sourceAsset: CrossSwapAsset,
    payloads: CrossSwapPayload[] | undefined
): boolean =>
    sourceAsset.assetId.split('/')[2] !== 'coin' &&
    mainPayloadOf(payloads)?.payloadType === CrossSwapPayloadType.AltVmDeposit;

const validatePayload = (
    payload: CrossSwapPayload,
    network: ChainKitNetwork,
    now: number
): void => {
    if (payload.validationStatus !== CrossSwapValidationStatus.Validated) {
        throw new Error(`Swap payload ${payload.payloadId} is not validated`);
    }
    if (new Date(payload.dateExpire).getTime() <= now) {
        throw new Error(`Swap payload ${payload.payloadId} has expired`);
    }
    if (networkOf(payload.chainId) !== network) {
        throw new Error(`Swap payload ${payload.payloadId} targets the wrong chain`);
    }
};

const sameSwapAddress = (chainId: string, a: string, b: string): boolean => {
    const network = normalizeSwapNetwork(chainId.split('/')[0]);
    if (network === 'ton') {
        try {
            return Address.parse(a).equals(Address.parse(b));
        } catch {
            return false;
        }
    }
    if (isEvmSwapNetwork(network)) return a.toLowerCase() === b.toLowerCase();
    return a === b;
};

const baseUnits = (value: string | undefined, field: string, payloadId: string): bigint => {
    if (value === undefined || !/^\d+$/.test(value)) {
        throw new Error(`Swap payload ${payloadId} has no valid ${field}`);
    }
    return BigInt(value);
};

const approvalSpenderOf = (payloads: CrossSwapPayload[] | undefined): string | undefined =>
    payloads?.find(payload => payload.kind === CrossSwapPayloadKind.Approval)?.humanSummary
        .approvalSpender;

/**
 * Holds a payload's summary to the route the user confirmed: the same pair,
 * the wallet's own address as recipient, and an approval of the source token
 * for at most the quoted spend unless an unlimited one was asked for. Reads
 * only the summary the schema defines for every payload type, so it holds
 * for any provider; a summary field the check needs that is absent or
 * malformed fails it.
 *
 * Spend and receive amounts are not compared with the route: the backend's
 * figures disagree with each other (a route source amount far off the
 * amount requested, a summary receive estimate under the route minimum),
 * and a cross-chain receive amount is settled by the provider, so the
 * comparison rejected sound swaps.
 */
const checkPayloadAgainstRoute = (
    payload: CrossSwapPayload,
    swap: MultichainSwapConfirmation
): void => {
    const { humanSummary: summary, payloadId } = payload;
    const { route } = swap;
    if (!isSameAssetId(summary.spendAsset, swap.sourceAsset.assetId)) {
        throw new Error(`Swap payload ${payloadId} spends another asset`);
    }
    // An approval receives nothing, and SwapKit leaves its receive asset empty.
    const receivesNothing = payload.kind === CrossSwapPayloadKind.Approval && !summary.receiveAsset;
    if (!receivesNothing && !isSameAssetId(summary.receiveAsset, swap.destinationAsset.assetId)) {
        throw new Error(`Swap payload ${payloadId} receives another asset`);
    }
    if (
        summary.recipientAddress !== undefined &&
        !sameSwapAddress(
            swap.destinationAsset.chainId,
            summary.recipientAddress,
            swap.destinationAddress
        )
    ) {
        throw new Error(`Swap payload ${payloadId} pays another recipient`);
    }
    if (payload.kind !== CrossSwapPayloadKind.Approval) return;

    if (swap.sourceAsset.assetId.split('/')[2] === 'coin') {
        throw new Error(`Swap payload ${payloadId} approves a chain coin`);
    }
    const quotedSpend = baseUnits(
        route.sourceAmount ?? route.maximumSourceAmount,
        'quoted source amount',
        payloadId
    );
    const approved = baseUnits(summary.approvalAmount, 'approval amount', payloadId);
    if (!swap.unlimitedApproval && approved > quotedSpend) {
        throw new Error(`Swap payload ${payloadId} approves more than quoted`);
    }
    const spender = summary.approvalSpender;
    if (!spender) throw new Error(`Swap payload ${payloadId} has no approval spender`);
    const quotedSpender = approvalSpenderOf(route.payloads);
    if (quotedSpender && !sameSwapAddress(payload.chainId, spender, quotedSpender)) {
        throw new Error(`Swap payload ${payloadId} approves another spender`);
    }
};

/**
 * The backend echoes the provider's gas limit, which is an exact estimate,
 * not a ceiling. iOS and Android both pad it before signing (approval ×1.5,
 * main swap ×1.2) so the tx doesn't run out of gas when chain state moves
 * between quote and broadcast.
 */
const scaledGasLimit = (gas: bigint, kind: CrossSwapPayload['kind']): bigint =>
    kind === CrossSwapPayloadKind.Approval ? (gas * 3n) / 2n : (gas * 6n) / 5n;

type SwapQuoteProvider = 'SwapKit' | 'SwapXyz';
type SwapQuotePayloadType = 'Exact' | 'Flex';

/** swaps.xyz and Omniston routes are signed through the same pipeline, as on iOS. */
const QUOTE_PROVIDER: Record<string, SwapQuoteProvider> = {
    [CrossSwapAggregator.Swapkit]: 'SwapKit',
    [CrossSwapAggregator.Swapsxyz]: 'SwapXyz',
    [CrossSwapAggregator.Omniston]: 'SwapXyz'
};

const quoteProviderOf = (aggregator: string): SwapQuoteProvider => {
    const provider = QUOTE_PROVIDER[aggregator];
    if (!provider) throw new Error(`Unsupported swap aggregator: ${aggregator}`);
    return provider;
};

/** Whether an `evm_tx` body holds router calldata; an unreadable body counts as holding it. */
const carriesEvmCalldata = (body: string): boolean => {
    try {
        const parsed: unknown = JSON.parse(body);
        if (!isJsonObject(parsed)) return true;
        const data = parsed.data;
        if (typeof data !== 'string') return false;
        return data !== '' && data.toLowerCase() !== '0x';
    } catch {
        return true;
    }
};

/**
 * The backend says whether a leg's calldata is `exact` or `flex`. Without
 * the field the wallet has to guess, and guessing `flex` for a payload that
 * carries its own transaction is destructive: chain-kit refuses an EVM one,
 * and replaces a BTC PSBT or a TRON raw transaction with a plain transfer.
 * So, as on iOS, only a leg this wallet builds itself is assumed flexible:
 * a deposit descriptor, an EVM transaction with no calldata, or a swaps.xyz
 * leg, whose calldata chain-kit always drops for the deposit address.
 */
const quotePayloadType = (
    payload: CrossSwapPayload,
    provider: SwapQuoteProvider,
    network: ChainKitNetwork
): SwapQuotePayloadType => {
    if (payload.calldataPayloadType) {
        return payload.calldataPayloadType === CrossSwapCalldataPayloadType.Flex ? 'Flex' : 'Exact';
    }
    if (payload.kind === CrossSwapPayloadKind.Approval || network === 'ton') return 'Exact';
    switch (payload.payloadType) {
        case CrossSwapPayloadType.AltVmDeposit:
            return 'Flex';
        case CrossSwapPayloadType.EvmTx:
            return provider === 'SwapXyz' || !carriesEvmCalldata(payload.payload)
                ? 'Flex'
                : 'Exact';
        case CrossSwapPayloadType.UtxoPsbt:
        case CrossSwapPayloadType.TronTx:
            return provider === 'SwapXyz' ? 'Flex' : 'Exact';
        default:
            return 'Exact';
    }
};

const isFlexPayload = (payload: CrossSwapPayload, swap: MultichainSwapConfirmation): boolean =>
    quotePayloadType(
        payload,
        quoteProviderOf(swap.prepared.aggregator),
        networkOf(swap.sourceAsset.chainId)
    ) === 'Flex';

/** A leg's body in the shape chain-kit's parsers read; see {@link parsableSwapPayloadBody}. */
const quotePayloadBody = (payload: CrossSwapPayload, network: ChainKitNetwork): string => {
    if (payload.payloadType !== CrossSwapPayloadType.AltVmDeposit) return payload.payload;
    try {
        return JSON.stringify(parsableSwapPayloadBody(payload, network));
    } catch {
        return payload.payload;
    }
};

export interface SwapQuotePayloadInput {
    provider: SwapQuoteProvider;
    type: SwapQuotePayloadType;
    payload: string;
    depositAddress: string | null;
    spendAmount: string;
}

/**
 * What chain-kit's `SwapPayload.fromQuote` parses a leg from. Both native
 * apps hand every leg to that parser, which knows each provider's payload
 * shapes — a swaps.xyz BTC leg, for one, is a transfer descriptor, not a
 * PSBT.
 */
export const swapQuotePayloadInput = (
    payload: CrossSwapPayload,
    aggregator: string,
    network: ChainKitNetwork
): SwapQuotePayloadInput => {
    const provider = quoteProviderOf(aggregator);
    return {
        provider,
        type: quotePayloadType(payload, provider, network),
        payload: quotePayloadBody(payload, network),
        depositAddress: payload.humanSummary.depositAddress?.trim() || null,
        spendAmount: payload.humanSummary.spendAmount
    };
};

/**
 * The summary's deposit memo for a `flex` leg the parser found none in, as
 * Android falls back to it: chain-kit rebuilds a `flex` leg, and without
 * the memo the deposit can't be matched to the swap.
 */
const flexDepositMemo = (payload: CrossSwapPayload, flex: boolean): string | undefined =>
    flex && payload.humanSummary.memo?.trim() ? payload.humanSummary.memo : undefined;

const paddedGasFee = (
    fee: Fee | null | undefined,
    kind: CrossSwapPayload['kind']
): Fee | undefined => {
    if (!fee) return undefined;
    const kit = chainkit();
    if (!(fee instanceof kit.Fee.Gas)) return fee;
    const limit = scaledGasLimit(fee.limit, kind);
    return new kit.Fee.Gas(fee.asset, limit, fee.price, limit * fee.price);
};

/**
 * Chain-coin base units the main leg moves out of the wallet on top of its
 * network fee — the value execution actually broadcasts, read off the same
 * payload. It can exceed the quoted source amount: a TON swap's message
 * value carries the gas the DEX contracts forward, and an EVM router or
 * bridge call can ask for native value beyond the traded amount, even when
 * the source is a token. A balance check against the quoted or typed amount
 * lets such swaps through to fail on-chain. A TON leg split over several
 * messages spends the sum of them. `undefined` when the payload doesn't say
 * (no main leg, unparseable, or a token source whose payload amount is
 * denominated in the token, as on a deposit descriptor).
 */
export const swapCoinSpend = (
    sourceAsset: CrossSwapAsset,
    payloads: CrossSwapPayload[] | undefined
): bigint | undefined => {
    const main = mainPayloadOf(payloads);
    if (!main) return undefined;
    try {
        const network = networkOf(sourceAsset.chainId);
        const isCoin = sourceAsset.assetId.split('/')[2] === 'coin';
        if (!isCoin && network !== 'ton' && !isEvmSwapNetwork(network)) return undefined;
        if (isTokenDepositSwapRoute(sourceAsset, payloads)) return undefined;
        if (network === 'ton') {
            return tonSwapPayloadMessages(main).reduce(
                (sum, message) => sum + parseQuantity(message.amount),
                0n
            );
        }
        if (isEvmSwapNetwork(network)) {
            return parseQuantity(
                (parsableSwapPayloadBody(main, network) as EvmPayload | null)?.value
            );
        }
        return parseQuantity(main.humanSummary.spendAmount);
    } catch {
        return undefined;
    }
};

const makeAccount = (
    asset: CrossSwapAsset,
    address: string,
    chain: Chain,
    wallet?: CryptoWallet
): Account => {
    const chainAsset = buildAsset(asset, chain);
    const chainAddress = chainkit().Address.Companion.force(address, chain);
    return wallet
        ? chainkit().Account.Companion.owned(
              chainAddress,
              chainAsset,
              wallet.getPublicKeyHex(chain),
              wallet.getPublicKeySegWit(chain)
          )
        : chainkit().Account.Companion.watch(chainAddress, chainAsset);
};

const makeTransaction = (
    input: MultichainSwapExecutionInput,
    payload: CrossSwapPayload,
    account: Account,
    destination: Account,
    chain: Chain,
    trimmedAmount?: bigint
): { transaction: Transaction; fee?: Fee } => {
    const network = networkOf(input.sourceAsset.chainId);
    if (network === 'ton' && tonSwapPayloadMessages(payload).length > 1) {
        throw new Error(`Swap payload ${payload.payloadId} is split over several messages`);
    }
    const quote = swapQuotePayloadInput(payload, input.prepared.aggregator, network);
    const kit = chainkit();
    const parsed = kit.SwapPayload.Companion.fromQuote(
        kit.SwapProvider[quote.provider],
        kit.SwapPayloadType[quote.type],
        chain,
        quote.payload,
        quote.depositAddress,
        quote.spendAmount
    );
    const to = kit.Address.Companion.force(parsed.to, chain);
    // A MAX fill of the chain coin leaves nothing for the fee until chain-kit
    // takes it out of the amount; priced as a plain send, a BTC sweep has no
    // UTXOs left to pay it and can't be estimated at all.
    const sweepsCoin =
        !!input.isMax &&
        quote.type === 'Flex' &&
        input.sourceAsset.assetId.split('/')[2] === 'coin';
    const transaction =
        payload.kind === CrossSwapPayloadKind.Approval
            ? new kit.Transaction.Call(account, 0n, to, parsed.data ?? '')
            : new kit.Transaction.Trade(
                  account,
                  trimmedAmount ?? parsed.amount,
                  destination,
                  to,
                  parsed.data,
                  trimmedAmount !== undefined || sweepsCoin,
                  undefined,
                  parsed.memo ?? flexDepositMemo(payload, quote.type === 'Flex')
              );
    return { transaction, fee: paddedGasFee(parsed.fee, payload.kind) };
};

interface GasReserve {
    /** The amount chain-kit trimmed a `flex` main leg to, when it had to. */
    trimmedAmount?: bigint;
    insufficient: boolean;
}

/**
 * chain-kit's gas reserve on the main leg, as both native apps run it: the
 * amount plus the fee of every leg must fit the live balance. `flex`
 * calldata may shrink to fit; `exact` calldata carries the amount inside
 * it, so a leg that doesn't fit as quoted is short rather than trimmed out
 * from under its calldata.
 */
const reserveMainGas = async (
    input: MultichainSwapExecutionInput,
    payload: CrossSwapPayload,
    transaction: Transaction,
    feeAmount: bigint,
    chain: Chain
): Promise<GasReserve> => {
    const kit = chainkit();
    const coin = kit.Asset.Coin.Companion.of(chain);
    const flex = isFlexPayload(payload, input);
    const energy = kit.Account.Companion.watch(
        kit.Address.Companion.force(input.sourceAddress, chain),
        coin
    );
    const helper = await getChainKitTransactionHelper();
    const reserve = unwrap(
        await helper.calculateGasReserve(
            transaction.account,
            energy,
            transaction.amount,
            !!input.isMax,
            new kit.Fee.Value(coin, feeAmount),
            flex ? kit.GasReservePolicy.ShrinkToFit : kit.GasReservePolicy.DrainOrError
        )
    );
    return {
        trimmedAmount: reserve.isAmountAdjusted && flex ? reserve.amount : undefined,
        insufficient: reserve.error != null || (reserve.isAmountAdjusted && !flex)
    };
};

interface PricedLeg {
    payload: CrossSwapPayload;
    transaction: Transaction;
    fee: Fee;
    estimated: boolean;
}

/**
 * Builds and prices every leg, then runs the gas reserve over the total fee
 * before anything is signed, so an approval is never broadcast for a main
 * leg the balance can't carry. A trimmed main leg is rebuilt with the
 * trimmed amount and keeps the fee it was priced at.
 */
const priceLegs = async (
    input: MultichainSwapExecutionInput,
    mediator: ChainMediator,
    account: Account,
    destination: Account,
    chain: Chain
): Promise<{ legs: PricedLeg[]; feeAmount: bigint; reserveInsufficient: boolean }> => {
    const legs: PricedLeg[] = [];
    for (const payload of validateAndOrderMultichainSwapPayloads(input)) {
        const built = makeTransaction(input, payload, account, destination, chain);
        const resolved = await resolveSwapFee(mediator, built.transaction, built.fee);
        legs.push({ payload, transaction: built.transaction, ...resolved });
    }
    const feeAmount = legs.reduce((sum, leg) => sum + leg.fee.amount, 0n);
    const main = legs.find(leg => leg.payload.kind === CrossSwapPayloadKind.Main)!;
    const reserve = await reserveMainGas(input, main.payload, main.transaction, feeAmount, chain);
    if (reserve.trimmedAmount !== undefined) {
        main.transaction = makeTransaction(
            input,
            main.payload,
            account,
            destination,
            chain,
            reserve.trimmedAmount
        ).transaction;
    }
    return { legs, feeAmount, reserveInsufficient: reserve.insufficient };
};

export const validateAndOrderMultichainSwapPayloads = (
    swap: MultichainSwapConfirmation,
    now = Date.now()
): CrossSwapPayload[] => {
    const { prepared } = swap;
    if (prepared.payloads.length === 0) throw new Error('Swap route has no payloads');
    if (prepared.aggregator !== swap.route.aggregator) {
        throw new Error('Prepared swap comes from another aggregator than its route');
    }
    const network = networkOf(swap.sourceAsset.chainId);
    prepared.payloads.forEach(payload => {
        validatePayload(payload, network, now);
        checkPayloadAgainstRoute(payload, swap);
    });
    const sorted = [...prepared.payloads].sort((a, b) => {
        const priority = (p: CrossSwapPayload) =>
            p.kind === CrossSwapPayloadKind.Approval ? 0 : 1;
        return priority(a) - priority(b);
    });
    if (!sorted.some(payload => payload.kind === CrossSwapPayloadKind.Main)) {
        throw new Error('Swap route has no main payload');
    }
    return sorted;
};

/**
 * A chain without a default fee — Bitcoin has none — reports why the
 * estimate failed, as iOS does: chain-kit refuses a BTC fee for an amount
 * the UTXOs can't cover together with it, and that shortage is what the
 * user has to be told, not the missing default.
 */
export const resolveSwapFee = async (
    mediator: Pick<ChainMediator, 'fee'>,
    transaction: Transaction,
    supplied?: Fee
): Promise<{ fee: Fee; estimated: boolean }> => {
    if (supplied) return { fee: supplied, estimated: true };
    const calculated = await mediator.fee.calculateFee(transaction);
    if (calculated.isOk) return { fee: unwrap(calculated), estimated: true };
    const fallback = await mediator.fee.getDefaultFee(transaction);
    return { fee: unwrap(fallback.isOk ? fallback : calculated), estimated: false };
};

export const estimateMultichainSwap = async (
    input: MultichainSwapExecutionInput
): Promise<MultichainSwapEstimation> => {
    const network = networkOf(input.sourceAsset.chainId);
    const mediator = await getChainKitMediator(network);
    const chain = chainKitChainOf(network);
    const account = makeAccount(input.sourceAsset, input.sourceAddress, chain);
    const destinationChain = chainKitChainOf(networkOf(input.destinationAsset.chainId));
    const destination = makeAccount(
        input.destinationAsset,
        input.destinationAddress,
        destinationChain
    );
    const { legs, feeAmount, reserveInsufficient } = await priceLegs(
        input,
        mediator,
        account,
        destination,
        chain
    );
    const feeAsset = legs[0].fee.asset;
    return {
        feeAmount,
        feeDecimals: feeAsset.decimals,
        feeSymbol: feeAsset.symbol,
        hasApproval: legs.some(leg => leg.payload.kind === CrossSwapPayloadKind.Approval),
        estimated: legs.every(leg => leg.estimated),
        reserveInsufficient
    };
};

export const executeMultichainSwap = async (
    input: MultichainSwapExecutionInput & { mnemonic: string[] }
): Promise<{ hashes: string[] }> => {
    const network = networkOf(input.sourceAsset.chainId);
    const mediator = await getChainKitMediator(network);
    const chain = chainKitChainOf(network);
    const wallet = chainkit().CryptoWallet.Companion.fromMnemonic(input.mnemonic.join(' '));
    const account = makeAccount(input.sourceAsset, input.sourceAddress, chain, wallet);
    const destinationChain = chainKitChainOf(networkOf(input.destinationAsset.chainId));
    const destination = makeAccount(
        input.destinationAsset,
        input.destinationAddress,
        destinationChain
    );
    const hashes: string[] = [];
    let nonce = unwrap(await mediator.account.estimateNonce(account));

    const { legs, reserveInsufficient } = await priceLegs(
        input,
        mediator,
        account,
        destination,
        chain
    );
    if (reserveInsufficient) {
        throw new Error('Balance does not cover the swap amount and its fee');
    }
    for (const { transaction, fee } of legs) {
        const signed =
            network === 'btc'
                ? await mediator.sign.transaction.signAndEncodeWithWallet(
                      transaction,
                      fee,
                      nonce,
                      wallet
                  )
                : await mediator.sign.transaction.signAndEncodeWithPrivateKey(
                      transaction,
                      fee,
                      nonce,
                      wallet.getPrivateKey(chain)
                  );
        const output = unwrap(signed).firstOutput();
        hashes.push(unwrap(await mediator.transaction.sendEncodedTransaction(account, output)));
        nonce += 1n;
    }
    return { hashes };
};
