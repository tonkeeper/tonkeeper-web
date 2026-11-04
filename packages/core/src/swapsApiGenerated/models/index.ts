/* tslint:disable */
/* eslint-disable */
/**
 * 
 * @export
 * @interface AssetCapabilities
 */
export interface AssetCapabilities {
    /**
     * 
     */
    assetId: string;
    /**
     * Short symbol (e.g. `TON`, `USDT`), best-effort
     */
    symbol?: string;
    /**
     * 
     */
    capabilities: Array<AssetCapability>;
    /**
     * 
     */
    details?: AssetCapabilityDetails;
}
/**
 * 
 * @export
 * @interface AssetCapabilitiesResponse
 */
export interface AssetCapabilitiesResponse {
    /**
     * 
     */
    assets: Array<AssetCapabilities>;
    /**
     * Asset IDs from the request that we have no record of in any subsystem
     */
    unknownAssetIds: Array<string>;
    /**
     * 
     */
    snapshotAgeSeconds?: AssetCapabilitiesSnapshotAge;
}
/**
 * Age in seconds of each subsystem's in-memory snapshot
 * @export
 * @interface AssetCapabilitiesSnapshotAge
 */
export interface AssetCapabilitiesSnapshotAge {
    /**
     * 
     */
    onramp?: number;
    /**
     * 
     */
    offramp?: number;
    /**
     * 
     */
    swap?: number;
    /**
     * 
     */
    p2p?: number;
}

/**
 * Capability flag. Clients must tolerate unknown values added later
 * @export
 */
export const AssetCapability = {
    Onramp: 'onramp',
    Offramp: 'offramp',
    Swap: 'swap',
    P2p: 'p2p',
} as const;
export type AssetCapability = typeof AssetCapability[keyof typeof AssetCapability];

/**
 * 
 * @export
 * @interface AssetCapabilityAggregators
 */
export interface AssetCapabilityAggregators {
    /**
     * 
     */
    aggregators?: Array<string>;
}
/**
 * Per-capability extra info. Keys appear only when meaningful for the listed capability
 * @export
 * @interface AssetCapabilityDetails
 */
export interface AssetCapabilityDetails {
    /**
     * 
     */
    onramp?: AssetCapabilityMerchants;
    /**
     * 
     */
    offramp?: AssetCapabilityMerchants;
    /**
     * 
     */
    swap?: AssetCapabilityAggregators;
    /**
     * 
     */
    p2p?: AssetCapabilityP2PInfo;
}
/**
 * 
 * @export
 * @interface AssetCapabilityMerchants
 */
export interface AssetCapabilityMerchants {
    /**
     * 
     */
    merchants?: Array<ExchangeMerchantSlug>;
}
/**
 * 
 * @export
 * @interface AssetCapabilityP2PInfo
 */
export interface AssetCapabilityP2PInfo {
    /**
     * P2P symbol matched against this asset (e.g. `TON`, `USDT`)
     */
    symbol?: string;
}
/**
 * 
 * @export
 * @interface BuildOmnistonSwapRequest
 */
export interface BuildOmnistonSwapRequest {
    /**
     * Source asset address
     */
    fromAsset: string;
    /**
     * Target asset address
     */
    toAsset: string;
    /**
     * Amount to swap (bid units)
     */
    fromAmount?: string;
    /**
     * Amount to receive (ask units)
     */
    toAmount?: string;
    /**
     * User wallet address
     */
    userAddress: string;
    /**
     * Slippage tolerance in basis points
     */
    slippage?: number;
    /**
     * Quote collection TTL in seconds
     */
    ttl?: number;
    /**
     * Disable referral fee
     */
    disableRefFee?: boolean;
    /**
     * Destination address (optional)
     */
    destinationAddress?: string;
}
/**
 * 
 * @export
 * @interface CalculateSwap400Response
 */
export interface CalculateSwap400Response {
    /**
     * Human-readable message, safe to show the user
     */
    error: string;
    /**
     * Stable machine-readable code — clients should branch on this
     */
    code: string;
    /**
     * UUID v4 for correlating the response to server logs
     */
    requestId: string;
}
/**
 * 
 * @export
 * @interface CreateCrossSwapQuoteRequest
 */
export interface CreateCrossSwapQuoteRequest {
    /**
     * Internal asset identifier (same format as onramp asset_id):
     * - native coin: `{chain}/{net}/coin` — e.g. `eth/mainnet/coin`, `btc/mainnet/coin`, `ton/mainnet/coin`
     * - TON jetton: `ton/mainnet/jetton/{raw_address}` — e.g. `ton/mainnet/jetton/0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe`
     * - EVM/Tron/Solana/NEAR token: `{chain}/{net}/{standard}/{address}` (e.g. `erc20`, `bep20`, `trc20`, `spl`, `nep141`) — `eth/mainnet/erc20/0xdc035d45d973e3ec169d2276ddab16f1e407384f` (USDS)
     * 
     */
    sourceAsset: string;
    /**
     * Source amount in minimal units. Required when `exact_type`
     * is `exact_input` (the default); ignored for `exact_output`.
     * 
     */
    sourceAmount?: string;
    /**
     * Internal asset identifier (see source_asset)
     */
    destinationAsset: string;
    /**
     * Destination amount in minimal units the user must receive.
     * Required when `exact_type` is `exact_output`; ignored for
     * `exact_input`.
     * 
     */
    destinationAmount?: string;
    /**
     * Address signing the source tx
     */
    senderAddress: string;
    /**
     * Address receiving funds on the destination chain
     */
    recipientAddress: string;
    /**
     * Forwarded to SwapsXYZ as `returnDepositAddress`, on
     * `/getQuote` when pricing and on `/getAction` when the route
     * is prepared. When true, upstream prices and builds a
     * deposit-based swap flow and returns a deposit address with
     * the transaction. Default false. Ignored by other
     * aggregators.
     * Ignored (forced to false) only when the source asset is on
     * TON and the client reports build 26.9.0 or newer on Android,
     * or 26.9.1 or newer on iOS, in its `Tonkeeper/<version>`
     * User-Agent: a deposit address puts a TON source on a pricier
     * upstream bridge route that those clients no longer need.
     * Older clients, clients of an unknown platform below 26.9.1,
     * and any non-TON source are honoured as sent.
     * Also forced to false, for every client regardless of build,
     * when both assets are on TON: a swap that stays on TON bridges
     * nothing, so a deposit address only buys the bridge fee.
     * 
     */
    returnDepositAddress?: boolean;
    /**
     * Turns the quote into a deposit: the destination asset is
     * delivered into this contract for `recipient_address`. Only
     * aggregators that can call a contract on the destination are
     * asked (`relay` today), and the swap routing -- small-swap
     * companion, fallback -- does not apply. `source_amount` is a
     * budget: the payloads never move more than it, and the route's
     * `estimated_destination_amount` equals
     * `minimum_destination_amount` -- the deposit is exact, and the
     * slippage allowed for is on the source side. `exact_type` must
     * be `exact_input`. `source_asset` may equal `destination_asset`.
     * With `include_payload: true` each route also carries
     * `execution_id`, which `/v2/crosschain/executions/{execution_id}`
     * answers from the moment of the quote: the aggregator follows
     * the deposit by the id it quoted, so no submit is needed for a
     * wallet that broadcasts on its own.
     * 
     */
    destinationTarget?: CrossSwapDestinationTarget;
    /**
     * Turns the quote into a withdrawal: the source asset is taken
     * out of this balance, for the account `sender_address` names,
     * and delivered to `recipient_address` as `destination_asset`.
     * Only aggregators that take from it are asked (`relay`
     * today), and the swap routing does not apply. As with a
     * `destination_target`, `source_amount` is a budget -- the
     * payload never moves more than it, fees of the balance itself
     * included -- and `exact_type` must be `exact_input`. Cannot be
     * combined with `destination_target`. With
     * `include_payload: true` each route carries `execution_id`,
     * answered from the moment of the quote.
     * 
     */
    sourceTarget?: CrossSwapSourceTarget;
    /**
     * Register a Lighter L2 signing key alongside the deposit. Only
     * with `destination_target: lighter`, and only on a relay-filled
     * route; a source that is already USDC on Ethereum is sent by the
     * wallet itself, which can call `changePubKey` directly.
     * 
     */
    changePubKey?: CrossSwapChangePubKey;
    /**
     * The wallet can send an EIP-7702 (type-4) transaction, and
     * asks for a token source's approval and payment as one:
     * an `evm_7702_batch_tx` payload in their place. Only
     * `relay`, only with `destination_target: lighter`, and only
     * on an Ethereum source whose sender is an EOA: a plain
     * account, one delegated to the service's delegate already, or
     * one delegated to any other -- whose delegation the
     * authorization then replaces. For a contract sender, anywhere
     * else, and on a route with no approval to fold, the payloads
     * are what they would be without it. Default false.
     * 
     */
    eip7702Batch?: boolean;
    /**
     * Route the quote across several aggregators instead of the
     * default one. Below `CROSSSWAP_MULTI_AGGREGATOR_BELOW_USD` the
     * swap is quoted by SwapsXYZ and SwapKit together and both
     * routes come back; SwapKit also answers when SwapsXYZ finds no
     * route. Pairs with TON on either side stay on SwapsXYZ.
     * Omitted, it is on for clients reporting build 26.9.2 or newer
     * in their `Tonkeeper/<version>` User-Agent, and the service
     * default applies to every older or unrecognised client; an
     * explicit `aggregators` list wins over both.
     * 
     */
    useMultiAggregator?: boolean;
    /**
     * True when `source_amount` is the entire balance of the
     * source asset. Forwarded to SwapsXYZ `/getAction` as
     * `isMax` when the route is prepared; the other aggregators
     * ignore it.
     * 
     */
    isMax?: boolean;
    /**
     * 
     */
    slippageBps?: number;
    /**
     * 
     */
    exactType?: CrossSwapExactType;
    /**
     * Optional whitelist of aggregators to query. Pass a single
     * entry to force one provider (e.g. `["swapkit"]`) — useful
     * for testing fallback behaviour before flipping defaults.
     * Naming aggregators also turns the fallback off: the list
     * is queried as given and nothing else is tried.
     * `swapkit` is not part of the default fan-out and is currently
     * quoted only when named here. When the server enables the
     * small-swap threshold (`CROSSSWAP_SWAPKIT_BELOW_USD`, off by
     * default) it is also queried without this field: first, and
     * alone, when the source side is worth less than the threshold,
     * and otherwise as a fallback after the fan-out returned no
     * route at all.
     * `omniston` serves TON to TON, and this field does not
     * decide that pair while the server runs with
     * `CROSSSWAP_FORCE_OMNISTON_TON` on, which is the default: the
     * swap is quoted from Omniston alone however the list reads,
     * and the aggregators named here are tried only if Omniston
     * returns no route. With the switch off the list wins, and the
     * pair otherwise defaults to Omniston only for clients below
     * Android 26.9.0 / iOS 26.9.1. `exact_output` follows the
     * same rules, answered by an exact-input search. Off a TON to
     * TON pair Omniston is quoted only when named here.
     * A requested aggregator that is disabled on the server is
     * reported in `provider_errors` with code
     * `provider_unavailable`; if none of the requested
     * aggregators are enabled the request fails with
     * `no_aggregators`.
     * 
     */
    aggregators?: Array<CrossSwapAggregator>;
    /**
     * Optional whitelist of underlying protocols
     */
    protocols?: Array<string>;
    /**
     * If true, backend also runs `prepare` inline for each route
     * and returns the signing payloads under
     * `routes[].payloads`. Lets the wallet skip the separate
     * `/v2/crosschain/routes/{route_id}/prepare` call. It adds an
     * upstream round-trip per route: for SwapsXYZ that is the
     * `/getAction` call that builds the transaction, which the
     * quote itself no longer makes — about three seconds.
     * 
     * **Ignored from build 26.13.0**, which calls prepare itself
     * once the user has picked a route. Older builds still get the
     * inline payloads, because they have no second call to fall
     * back on. Note the route only lives as long as
     * `routes[].date_expire` says — 60 seconds for SwapsXYZ and
     * for TON-to-TON — so a prepare that comes later is answered
     * `400 route_expired` and the quote has to be repeated.
     * 
     */
    includePayload?: boolean;
}


/**
 * 
 * @export
 * @interface CreateExchangeRequest
 */
export interface CreateExchangeRequest {
    /**
     * Source currency code
     */
    from: string;
    /**
     * Target currency code
     */
    to: string;
    /**
     * Source crypto network
     */
    fromNetwork?: string;
    /**
     * Target crypto network
     */
    toNetwork?: string;
    /**
     * User wallet address
     */
    wallet: string;
    /**
     * Destination Tag / Memo for chains that require it on the destination address (XRP, XLM, EOS, BNB-Beacon, HBAR, etc.)
     */
    extraId?: string;
    /**
     * 
     */
    flow?: ExchangeFlow;
    /**
     * User country code (ISO 3166-1 alpha-2). Deprecated: use device_country_code and store_country_code query parameters instead
     * @deprecated
     */
    country?: string;
}


/**
 * 
 * @export
 * @interface CreateOfframpOrderRequest
 */
export interface CreateOfframpOrderRequest {
    /**
     * 
     */
    sourceAssetId: string;
    /**
     * 
     */
    fiat: string;
    /**
     * Source crypto decimal. When `reverse=true`, target fiat
     */
    amount: string;
    /**
     * 
     */
    reverse?: boolean;
    /**
     * User's address on the source chain
     */
    fromAddress: string;
    /**
     * Memo / Destination Tag if required by the chain
     */
    extraId?: string;
    /**
     * 
     */
    payoutMethod: ExchangePaymentMethodType;
    /**
     * 
     */
    merchant: ExchangeMerchantSlug;
    /**
     * Pin quote from /v2/offramp/quote
     */
    merchantTransactionId?: string;
    /**
     * Wallet deep link; server appends `?ramp_order_id={id}`
     */
    redirectUrl?: string;
    /**
     * BCP-47 tag
     */
    language?: string;
}


/**
 * 
 * @export
 * @interface CreateOnrampOrderRequest
 */
export interface CreateOnrampOrderRequest {
    /**
     * 
     */
    targetAssetId: string;
    /**
     * 
     */
    fiat: string;
    /**
     * Fiat decimal. When `reverse=true`, target crypto
     */
    amount: string;
    /**
     * 
     */
    reverse?: boolean;
    /**
     * User's wallet on the target chain
     */
    destinationAddress: string;
    /**
     * Memo / Destination Tag if required by the chain
     */
    extraId?: string;
    /**
     * 
     */
    paymentMethod: ExchangePaymentMethodType;
    /**
     * 
     */
    merchant: ExchangeMerchantSlug;
    /**
     * Pin quote from /v2/onramp/quote
     */
    merchantTransactionId?: string;
    /**
     * Wallet deep link; server appends `?ramp_order_id={id}`
     */
    redirectUrl?: string;
    /**
     * BCP-47 tag
     */
    language?: string;
}


/**
 * 
 * @export
 * @interface CreateP2PSessionRequest
 */
export interface CreateP2PSessionRequest {
    /**
     * Withdrawal wallet address
     */
    wallet: string;
    /**
     * Internal asset identifier, e.g. `ton/mainnet/coin` or `ton/mainnet/jetton/{raw_address}`. Preferred over the legacy `crypto_currency` + `network` pair
     */
    assetId?: string;
    /**
     * Crypto currency code. Deprecated: use asset_id instead
     * @deprecated
     */
    cryptoCurrency?: string;
    /**
     * Blockchain network identifier. Deprecated: use asset_id instead
     * @deprecated
     */
    network?: string;
    /**
     * Fiat currency code
     */
    fiatCurrency: string;
    /**
     * Optional exchange amount
     */
    amount?: number;
}

/**
 * Cross-chain aggregator that produced the route.
 * `omniston` serves TON to TON, and swaps leaving TON for an EVM chain
 * (`eth`, `bsc`, `arb`, `base`, `polygon`, `avax`) when both sides are
 * stablecoins. Those it settles through an escrow, so the route is one
 * TON message and the swap completes minutes later; it is not quoted
 * into TON, and not above roughly $1000.
 * 
 * A swap out of TON worth less than
 * `CROSSSWAP_OMNISTON_CROSSCHAIN_BELOW_USD` is quoted from Omniston
 * alone, because its spread there is flat rather than proportional. An
 * `aggregators` list or an exclusion naming `omniston` overrides that.
 * 
 * How the TON to TON pair is routed is a server switch,
 * `CROSSSWAP_FORCE_OMNISTON_TON`.
 * 
 * While it is on, which is the default, a swap that stays on TON is
 * quoted from Omniston alone — whatever `aggregators` names, whatever it
 * excludes, whatever build the client reports. The other aggregators are
 * tried only if Omniston returns no route.
 * 
 * While it is off, the pair follows the ordinary rules: clients below
 * Android 26.9.0 / iOS 26.9.1 still get Omniston alone, newer ones are
 * fanned out, and an explicit `aggregators` list wins for either.
 * 
 * `exact_output` follows the same switch: within TON it is answered by
 * searching Omniston's exact-input quotes (and swaps.xyz's, which
 * route through Omniston) for the source amount that yields
 * `destination_amount`. Off a
 * TON to TON pair Omniston is quoted only when `aggregators` names it.
 * `relay` serves Lighter deposits and withdrawals only: it is quoted when
 * the request names a `destination_target` or a `source_target`, and
 * never in the swap fan-out.
 * 
 * @export
 */
export const CrossSwapAggregator = {
    Swapkit: 'swapkit',
    Swapsxyz: 'swapsxyz',
    Omniston: 'omniston',
    Relay: 'relay',
} as const;
export type CrossSwapAggregator = typeof CrossSwapAggregator[keyof typeof CrossSwapAggregator];


/**
 * Controls how ERC-20 approve transactions are issued for prepare:
 * - exact: amount equals the swap source_amount (default; safest)
 * - max: amount is uint256 max — saves gas on subsequent swaps but
 *   grants the router unlimited allowance until manually revoked
 * 
 * @export
 */
export const CrossSwapApprovalMode = {
    Exact: 'exact',
    Max: 'max',
} as const;
export type CrossSwapApprovalMode = typeof CrossSwapApprovalMode[keyof typeof CrossSwapApprovalMode];

/**
 * 
 * @export
 * @interface CrossSwapAsset
 */
export interface CrossSwapAsset {
    /**
     * Internal asset identifier (`{chain}/{net}/coin` for natives, `{chain}/{net}/{type}/{address}` for tokens)
     */
    assetId: string;
    /**
     * 
     */
    symbol: string;
    /**
     * 
     */
    name: string;
    /**
     * 
     */
    decimals: number;
    /**
     * URL of the asset's logo, may be empty
     */
    image?: string;
    /**
     * 
     */
    chainFamily: CrossSwapChainFamily;
    /**
     * 
     */
    stablecoin?: boolean;
    /**
     * Aggregators that list this asset. Every asset Omniston serves is
     * also reported under `swapsxyz`: Omniston is TON to TON only and
     * is out of the default fan-out for newer clients, while SwapsXYZ
     * routes the same TON pairs. The tag says the asset can be quoted,
     * not that SwapsXYZ bridges it off TON; `allowed_counterparts`
     * stays the authority for restricted assets.
     * 
     */
    supportedAggregators: Array<CrossSwapAggregator>;
    /**
     * Whitelist of asset_ids this asset may be paired with. Omitted when there
     * are no restrictions. Present for tokenized RWAs (e.g. Backed Finance
     * stocks) where issuer policy limits which counterparts are permitted.
     * 
     */
    allowedCounterparts?: Array<string>;
    /**
     * 
     */
    usdPrice?: number;
    /**
     * 
     */
    verified?: boolean;
    /**
     * 
     */
    isScam?: boolean;
    /**
     * 
     */
    marketCapUsd?: number;
}


/**
 * 
 * @export
 * @interface CrossSwapAssets
 */
export interface CrossSwapAssets {
    /**
     * 
     */
    assets: Array<CrossSwapAsset>;
    /**
     * Cursor for the next page. Absent when there are no more pages.
     */
    nextCursor?: string;
}

/**
 * 
 * @export
 */
export const CrossSwapBroadcastMode = {
    Backend: 'backend',
    Client: 'client',
} as const;
export type CrossSwapBroadcastMode = typeof CrossSwapBroadcastMode[keyof typeof CrossSwapBroadcastMode];


/**
 * Whether the amount inside `payload` is fixed.
 * `exact` - the amount is part of the calldata and must be signed as
 * received. `flex` - the payload is a plain transfer, so the wallet may
 * change the amount before signing, which is what a max send needs.
 * 
 * @export
 */
export const CrossSwapCalldataPayloadType = {
    Exact: 'exact',
    Flex: 'flex',
} as const;
export type CrossSwapCalldataPayloadType = typeof CrossSwapCalldataPayloadType[keyof typeof CrossSwapCalldataPayloadType];


/**
 * Source chain identifier used across cross-swap requests
 * @export
 */
export const CrossSwapChain = {
    Ton: 'ton',
    Eth: 'eth',
    Btc: 'btc',
    Sol: 'sol',
    Bsc: 'bsc',
    Arb: 'arb',
    Op: 'op',
    Base: 'base',
    Polygon: 'polygon',
    Avax: 'avax',
    Robinhood: 'robinhood',
    Tron: 'tron',
    Near: 'near',
    Ltc: 'ltc',
    Doge: 'doge',
    Xrp: 'xrp',
    Ada: 'ada',
} as const;
export type CrossSwapChain = typeof CrossSwapChain[keyof typeof CrossSwapChain];


/**
 * Chain family group used to pick signing/broadcast handlers
 * @export
 */
export const CrossSwapChainFamily = {
    Utxo: 'UTXO',
    Evm: 'EVM',
    Solana: 'SOLANA',
    Ton: 'TON',
    Cosmos: 'COSMOS',
    Tron: 'TRON',
    Ripple: 'RIPPLE',
    Lighter: 'LIGHTER',
    Other: 'OTHER',
} as const;
export type CrossSwapChainFamily = typeof CrossSwapChainFamily[keyof typeof CrossSwapChainFamily];

/**
 * Register a Lighter L2 signing key in the same cross-chain action as the
 * deposit, so a wallet that holds no ETH never has to pay for the call
 * itself. Only with `destination_target: lighter`.
 * On a deposit of USDC on Ethereum, which the wallet sends itself, the
 * registration is the third call of the EIP-7702 batch, after the
 * approval and the deposit: it needs `eip7702_batch: true`, a sender
 * that is the recipient (changePubKey runs as the sender), and a sender
 * that can run the batch -- an EOA. `authorization` and `execute` are
 * then absent: the wallet's own type-4 transaction delegates, and a call
 * the account makes to itself needs no signature over it. A quote that
 * cannot carry it this way is refused rather than given without it.
 * On a route relay fills:
 * Lighter's `changePubKey` insists the caller is the account owner, and
 * under relay the caller is the solver's multicaller. The way round that
 * is EIP-7702: `authorization` delegates the owner's own EOA to the
 * delegate contract for the fill, and the solver then calls into that
 * EOA, so `msg.sender` is the owner. The delegate is pinned by the
 * service; an authorization naming any other address is refused.
 * The solver is not the account, so the delegate runs the call only
 * with the owner's signature over it: `execute`. Both go together.
 * Asked with neither, the quote is a preview: priced as the signed one
 * will be, with no payloads and no execution, and the route carries
 * `change_pub_key_signing` -- the nonces and the deadline the owner
 * signs both over. The same request again with the two signatures is
 * the quote to send.
 * 
 * @export
 * @interface CrossSwapChangePubKey
 */
export interface CrossSwapChangePubKey {
    /**
     * The Lighter account the key is registered on. 281474976710655
     * (2^48 - 1, Lighter's `NIL_ACCOUNT_INDEX`) is the caller's own
     * account, resolved when the call runs -- the one to use, and the
     * only one a deposit that creates the account can name: `deposit`
     * assigns the index on L1 earlier in the same batch. An explicit
     * index is taken by L1 as given, even a wrong one, and fails only
     * on L2, with the deposit landed and the key not set.
     * 
     */
    accountIndex: number;
    /**
     * The slot the key goes into. 255 is Lighter's "all keys" sentinel
     * and is not a slot.
     * 
     */
    apiKeyIndex: number;
    /**
     * The L2 public key, 40 bytes.
     */
    pubKey: string;
    /**
     * 
     */
    authorization?: EIP7702Authorization;
    /**
     * 
     */
    execute?: HermesExecuteSignature;
}
/**
 * What the owner signs to register the key on a route relay fills, for
 * a quote asked with `change_pub_key` and no signatures. The route is
 * then a preview: no payloads, and a prepare is refused. Sign the
 * authorization over these values, the Execute over `execute.nonce`
 * and `execute.deadline` (see `HermesExecuteSignature`), and quote
 * again with both.
 * On a route from Ethereum there is no fill: relay swaps in the
 * sender's own transaction and runs the calls from it, so that
 * transaction delegates the address -- the batch by its own
 * authorization, a single payment by an `authorization` the payload
 * carries for the wallet to sign into it. `authorization` is then
 * absent here, and the quote again takes `execute` alone.
 * 
 * @export
 * @interface CrossSwapChangePubKeySigning
 */
export interface CrossSwapChangePubKeySigning {
    /**
     * 
     */
    authorization?: CrossSwapChangePubKeySigningAuthorization;
    /**
     * 
     */
    execute: CrossSwapChangePubKeySigningExecute;
}
/**
 * 
 * @export
 * @interface CrossSwapChangePubKeySigningAuthorization
 */
export interface CrossSwapChangePubKeySigningAuthorization {
    /**
     * 
     */
    chainId: number;
    /**
     * The delegate this service pins.
     */
    address: string;
    /**
     * The owner's nonce on Ethereum now.
     */
    nonce: number;
}
/**
 * 
 * @export
 * @interface CrossSwapChangePubKeySigningExecute
 */
export interface CrossSwapChangePubKeySigningExecute {
    /**
     * The owner's Hermes nonce now (HermesV1.nonceOf).
     */
    nonce: number;
    /**
     * Unix seconds; the signed quote takes it while at least 5 minutes remain.
     */
    deadline: number;
}
/**
 * 
 * @export
 * @interface CrossSwapConfig
 */
export interface CrossSwapConfig {
    /**
     * Slippage options keyed by source-chain identifier (see `CrossSwapChain` enum,
     * e.g. `ton`, `eth`, `btc`). Chains absent from this map fall through to a
     * wallet-side default of 100 bps.
     * 
     */
    slippages: { [key: string]: CrossSwapSlippageOptions; };
    /**
     * 
     */
    swapPair: CrossSwapDefaultPair;
}
/**
 * Server-driven pair to pre-select in the cross-swap UI on cold open. Backend controls
 * this so we can rotate the default (A/B tests, promoted pairs) without a client
 * release. Clients should treat both asset_ids as opaque and pass them directly to
 * `/v2/crosschain/quotes`.
 * 
 * @export
 * @interface CrossSwapDefaultPair
 */
export interface CrossSwapDefaultPair {
    /**
     * Asset id for the pre-selected source (sell) side.
     * @deprecated
     */
    sourceAssetId: string;
    /**
     * Asset id for the pre-selected destination (buy) side.
     * @deprecated
     */
    destinationAssetId: string;
    /**
     * 
     */
    sourceAsset: CrossSwapAsset;
    /**
     * 
     */
    destinationAsset: CrossSwapAsset;
}

/**
 * A contract on the destination chain the delivered asset is handed to,
 * instead of the recipient's wallet. `recipient_address` is then the
 * account that contract credits.
 * `lighter`: Lighter's L1 deposit gateway on Ethereum. The destination
 * asset must be USDC on Ethereum
 * (`eth/mainnet/erc20/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`) and
 * `recipient_address` the Ethereum address whose Lighter account is
 * credited. Quoted from `ton`, `eth`, `bsc`, `base`, `arb`, `tron`
 * (TRX and TRC-20 tokens) and `btc`; a `btc` quote spends the sender's
 * own outputs, so the sender must hold the amount already. USDC
 * already on Ethereum is quoted as a direct gateway call with no
 * aggregator (protocol `lighter_gateway`, nothing to track), anything
 * else through `relay`.
 * 
 * @export
 */
export const CrossSwapDestinationTarget = {
    Lighter: 'lighter',
} as const;
export type CrossSwapDestinationTarget = typeof CrossSwapDestinationTarget[keyof typeof CrossSwapDestinationTarget];


/**
 * Which side of the swap the client fixes.
 * `exact_input` (default): `source_amount` is what the user pays, routes
 * report `estimated_destination_amount`.
 * `exact_output`: `destination_amount` is what the user must receive,
 * routes report the `source_amount` the user is expected to pay and
 * `maximum_source_amount`, the cap including slippage. Off TON only
 * `swapsxyz` can quote `exact_output`; other aggregators are skipped and
 * reported in `provider_errors`. Within TON (both assets on TON) only
 * `omniston` and `swapsxyz` answer it, each quoted exact-input for the
 * smallest source amount found whose estimate reaches
 * `destination_amount`: the route is an ordinary
 * exact-input swap of that amount, so `maximum_source_amount` equals
 * `source_amount`, `estimated_destination_amount` is at least
 * `destination_amount` (within 0.15%), and slippage lands on the
 * destination side as `minimum_destination_amount`. Both assets must
 * have a USD price; a pair without one, or a route found that way which
 * loses more than 1% of its USD value, is reported in `provider_errors`
 * with code `no_route` instead.
 * 
 * @export
 */
export const CrossSwapExactType = {
    ExactInput: 'exact_input',
    ExactOutput: 'exact_output',
} as const;
export type CrossSwapExactType = typeof CrossSwapExactType[keyof typeof CrossSwapExactType];

/**
 * 
 * @export
 * @interface CrossSwapExecution
 */
export interface CrossSwapExecution {
    /**
     * 
     */
    executionId: string;
    /**
     * 
     */
    status: CrossSwapExecutionStatus;
    /**
     * 
     */
    aggregator: CrossSwapAggregator;
    /**
     * Underlying protocol or DEX that actually executes the swap (provider-driven, free-form).
     */
    protocol?: string;
    /**
     * 
     */
    providerTrackingId?: string;
    /**
     * 
     */
    sourceTxHash?: string;
    /**
     * 
     */
    destinationTxHash?: string;
    /**
     * 
     */
    errorCode?: string;
    /**
     * 
     */
    errorMessage?: string;
    /**
     * 
     */
    explorerUrl?: string;
    /**
     * Per-leg progress for multi-hop swaps (THORChain, Mayachain, Chainflip,
     * Near Intents). Empty for single-leg swaps — `status` already covers them.
     * 
     */
    legs?: Array<CrossSwapExecutionLeg>;
    /**
     * 
     */
    dateUpdate: string;
}


/**
 * 
 * @export
 * @interface CrossSwapExecutionLeg
 */
export interface CrossSwapExecutionLeg {
    /**
     * 
     */
    legIndex: number;
    /**
     * Chain on which this leg executed (e.g. `eth/mainnet`)
     */
    chainId: string;
    /**
     * 
     */
    status: CrossSwapExecutionStatus;
    /**
     * 
     */
    txHash?: string;
    /**
     * Internal asset id consumed by this leg
     */
    fromAsset?: string;
    /**
     * Internal asset id produced by this leg
     */
    toAsset?: string;
    /**
     * Set when the leg has reached a terminal state
     */
    dateFinish?: string;
}



/**
 * 
 * @export
 */
export const CrossSwapExecutionStatus = {
    NotStarted: 'not_started',
    SourceTxPending: 'source_tx_pending',
    SourceTxSubmitted: 'source_tx_submitted',
    SourceTxConfirmed: 'source_tx_confirmed',
    Bridging: 'bridging',
    Streaming: 'streaming',
    DestinationPending: 'destination_pending',
    DestinationSettled: 'destination_settled',
    Refunded: 'refunded',
    Failed: 'failed',
    Expired: 'expired',
    Unknown: 'unknown',
} as const;
export type CrossSwapExecutionStatus = typeof CrossSwapExecutionStatus[keyof typeof CrossSwapExecutionStatus];

/**
 * 
 * @export
 * @interface CrossSwapFee
 */
export interface CrossSwapFee {
    /**
     * Fee category emitted by the aggregator (provider-driven, free-form).
     */
    type: string;
    /**
     * Asset the fee is denominated in (internal asset id)
     */
    asset: string;
    /**
     * Chain on which the fee is paid, format `{chain}/{net}`
     */
    chainId?: string;
    /**
     * Fee amount in minimal units
     */
    amount: string;
    /**
     * Fee value in USD (decimal string), if known
     */
    amountUsd?: string;
}
/**
 * 
 * @export
 * @interface CrossSwapHumanSummary
 */
export interface CrossSwapHumanSummary {
    /**
     * 
     */
    action: string;
    /**
     * 
     */
    spendAsset: string;
    /**
     * 
     */
    spendAmount: string;
    /**
     * 
     */
    receiveAsset: string;
    /**
     * 
     */
    receiveAmount?: string;
    /**
     * Least amount of `receive_asset` the built transaction lets
     * through, as the aggregator reported it when building, in minimal
     * units. It can be below the route's `minimum_destination_amount`:
     * the aggregator may reprice between quote and build. Omitted when
     * the aggregator reports none at build time; then only the route's
     * `minimum_destination_amount` is known.
     * 
     */
    minimumReceiveAmount?: string;
    /**
     * Final destination of the swap (user's address on destination chain)
     */
    recipientAddress?: string;
    /**
     * 
     */
    depositAddress?: string;
    /**
     * 
     */
    memo?: string;
    /**
     * Underlying protocol or DEX that actually executes the swap (provider-driven, free-form).
     */
    protocol?: string;
    /**
     * For payloads with `kind: approval`, the spender contract being
     * authorised. Backend decodes this from the approve calldata so the
     * wallet can verify before signing.
     * 
     */
    approvalSpender?: string;
    /**
     * For payloads with `kind: approval`, the amount being approved (in
     * minimal units). Backend re-encodes the approve tx to enforce this
     * value — clients can trust it matches the calldata.
     * 
     */
    approvalAmount?: string;
    /**
     * 
     */
    warnings?: Array<string>;
}
/**
 * Informational description of one hop inside the route. Legs do not require separate user signatures
 * @export
 * @interface CrossSwapLeg
 */
export interface CrossSwapLeg {
    /**
     * 
     */
    legIndex: number;
    /**
     * 
     */
    type: CrossSwapLegType;
    /**
     * Internal chain identifier, format `{chain}/{net}` (e.g. `eth/mainnet`)
     */
    chainId: string;
    /**
     * 
     */
    chainFamily: CrossSwapChainFamily;
    /**
     * 
     */
    fromAsset?: string;
    /**
     * 
     */
    toAsset?: string;
    /**
     * 
     */
    fromAmount?: string;
    /**
     * 
     */
    estimatedToAmount?: string;
    /**
     * Underlying protocol or DEX that actually executes the swap (provider-driven, free-form).
     */
    protocol?: string;
}



/**
 * 
 * @export
 */
export const CrossSwapLegType = {
    Approve: 'approve',
    Deposit: 'deposit',
    Bridge: 'bridge',
    Swap: 'swap',
    Transfer: 'transfer',
} as const;
export type CrossSwapLegType = typeof CrossSwapLegType[keyof typeof CrossSwapLegType];

/**
 * 
 * @export
 * @interface CrossSwapPayload
 */
export interface CrossSwapPayload {
    /**
     * 
     */
    payloadId: string;
    /**
     * 
     */
    kind: CrossSwapPayloadKind;
    /**
     * Internal chain identifier, format `{chain}/{net}`
     */
    chainId: string;
    /**
     * 
     */
    chainFamily: CrossSwapChainFamily;
    /**
     * 
     */
    payloadType: CrossSwapPayloadType;
    /**
     * 
     */
    calldataPayloadType?: CrossSwapCalldataPayloadType;
    /**
     * Payload data. Encoding depends on `payload_type`:
     *   * `ton_boc`: JSON-array string of TON Connect messages
     *     `[{address, amount, payload: base64_boc, stateInit?}, ...]`
     *     (not raw base64 — the outer envelope is JSON). A `relay`
     *     payload adds `bounce` and `mode` to each message, as the
     *     aggregator built it; a wallet that ignores them keeps its
     *     defaults.
     *   * `lighter_transfer`: JSON-encoded Lighter L2 transfer, chain
     *     `lighter/mainnet`: `{"to_account_index", "asset_index",
     *     "from_route_type", "to_route_type", "amount", "usdc_fee",
     *     "memo"}`, integers as numbers and `memo` 0x and 32 bytes of
     *     hex. The wallet signs it as a Lighter transfer (tx type 12)
     *     from the account `sender_address` names, with the account's
     *     API key and -- the recipient being another account -- the
     *     owner's L1 key over Lighter's transfer message, and sends it to
     *     Lighter. `amount` plus `usdc_fee` is what leaves the account.
     *   * `utxo_psbt`: base64-encoded PSBT bytes. A `relay` PSBT spends
     *     the sender's own outputs: sign every input and broadcast.
     *   * `utxo_pczt`: base64-encoded PCZT bytes.
     *   * `evm_tx`, `evm_approval_tx`: JSON-encoded EVM transaction
     *     object (to, data, value, chainId, ...) as returned by the
     *     aggregator. For `relay`, `gas` is a gas limit, decimal, with
     *     headroom already in it -- relay's own figure, or on Ethereum
     *     where relay states none (a direct deposit, sometimes the
     *     payment) this service's estimate raised by 30%, the payment
     *     after an approval estimated as if the approval were mined. It
     *     is absent when neither exists or the estimate reverted.
     *     A `swapsxyz` payload with `calldata_payload_type: exact` is
     *     the flat object `{to, value, data?, gas?, gasPrice?}`, amounts
     *     decimal or 0x hex. When the token needs an allowance it comes
     *     after a `kind: approval` `evm_approval_tx` built by this
     *     service: `{to: token, value: "0", data: approve(router in the
     *     main payload's to, spend amount)}`, and the main payload then
     *     carries no `requires_token_approval`. swaps.xyz states no gas:
     *     this service estimates `gas` (with 30%
     *     headroom, the payment as if the approval were mined) and reads
     *     `gasPrice` from the node, both decimal; either is absent when
     *     the node gives none. The same holds on every EVM chain with a
     *     node configured (SWAPSXYZ_EVM_RPC_URLS); one without carries
     *     no gas.
     *   * `evm_7702_batch_tx`: JSON-encoded EVM transaction that
     *     replaces an approval and the payment after it, on
     *     `eth/mainnet`, when the quote asked for `eip7702_batch`:
     *     `{from, to, data, value, chainId, gas?, maxFeePerGas?,
     *     maxPriorityFeePerGas?, gasPrice?, delegate, authorization?}`.
     *     `to` is `from` itself, and `data` is ERC-7821
     *     `execute(0x01 followed by 31 zero bytes, abi.encode(Call[]))`
     *     with two calls: the approve, then the payment, which run as
     *     `delegate`'s code at the sender's address and revert
     *     together. `authorization`, `{chainId, address, nonce}`, is
     *     present when the address is not delegated yet: the wallet
     *     sends a type-4 transaction whose authorization list holds one
     *     it signs for `address` on `chainId` with `nonce`, which is the
     *     sender's nonce at the quote plus one -- the transaction's own
     *     nonce plus one, since the wallet sends it. A wallet whose next
     *     nonce plus one is not `nonce` re-quotes: the chain skips a
     *     stale authorization and the call then does nothing. Without
     *     it, a plain transaction. The delegation
     *     stays after the deposit, until the address authorizes
     *     another delegate or address zero. `gas` includes the
     *     authorization's cost.
     *   * `solana_tx`, `cosmos_tx`, `tron_tx`, `ripple_tx`: chain-native
     *     serialized transaction bytes (base64) or aggregator-specific
     *     envelope; parse per `chain_id`.
     *     A `relay` `tron_tx` is the JSON object
     *     `{"type":"TriggerSmartContract","parameter":{owner_address,
     *     contract_address, call_value, data}}`, addresses in hex with
     *     the `41` prefix and `data` without `0x`, for the wallet to
     *     build (e.g. TronWeb `triggerSmartContract`) and sign.
     *   * `alt_vm_deposit`: chain-specific deposit descriptor
     *     (JSON or address+memo pair) — inspect `chain_id`.
     * 
     */
    payload: string;
    /**
     * 
     */
    humanSummary: CrossSwapHumanSummary;
    /**
     * 
     */
    validationStatus: CrossSwapValidationStatus;
    /**
     * 
     */
    dateExpire: string;
    /**
     * If true, the wallet MUST send an ERC-20 `approve` for the spender
     * (see `human_summary.approval_spender`) before broadcasting this
     * payload. If false, the calldata is a direct `transfer` and no
     * approve is needed. Set only for EVM payloads originating from
     * aggregators that surface this flag (currently swapsxyz).
     * 
     */
    requiresTokenApproval?: boolean;
}



/**
 * 
 * @export
 */
export const CrossSwapPayloadKind = {
    Main: 'main',
    Approval: 'approval',
} as const;
export type CrossSwapPayloadKind = typeof CrossSwapPayloadKind[keyof typeof CrossSwapPayloadKind];


/**
 * Encoding of the payload to be signed by the wallet
 * @export
 */
export const CrossSwapPayloadType = {
    UtxoPsbt: 'utxo_psbt',
    UtxoPczt: 'utxo_pczt',
    EvmTx: 'evm_tx',
    EvmApprovalTx: 'evm_approval_tx',
    SolanaTx: 'solana_tx',
    TonBoc: 'ton_boc',
    CosmosTx: 'cosmos_tx',
    TronTx: 'tron_tx',
    RippleTx: 'ripple_tx',
    AltVmDeposit: 'alt_vm_deposit',
    LighterTransfer: 'lighter_transfer',
    Evm7702BatchTx: 'evm_7702_batch_tx',
} as const;
export type CrossSwapPayloadType = typeof CrossSwapPayloadType[keyof typeof CrossSwapPayloadType];

/**
 * 
 * @export
 * @interface CrossSwapPrepare
 */
export interface CrossSwapPrepare {
    /**
     * 
     */
    routeId: string;
    /**
     * The aggregator's own identifier for this route, as the built
     * transaction carries it. For swapsxyz this is the `txId` that
     * `/getAction` minted, which is the id its own dashboards and
     * `/getStatus` know the swap by; a quote that was not prepared
     * inline carries an id of ours instead, so this is where the
     * upstream one first appears. Omitted when the provider exposes
     * none.
     * 
     */
    providerRouteId?: string;
    /**
     * 
     */
    aggregator: CrossSwapAggregator;
    /**
     * 
     */
    payloads: Array<CrossSwapPayload>;
    /**
     * The execution opened for this route, when the provider can follow
     * it before a payload is submitted (a `relay` deposit). Absent
     * otherwise: submit the signed payload to get one.
     * 
     */
    executionId?: string;
}


/**
 * Per-aggregator error explaining why a quote returned no route
 * @export
 * @interface CrossSwapProviderError
 */
export interface CrossSwapProviderError {
    /**
     * 
     */
    aggregator: CrossSwapAggregator;
    /**
     * Underlying protocol or DEX that actually executes the swap (provider-driven, free-form).
     */
    protocol?: string;
    /**
     * 
     */
    code: CrossSwapProviderErrorCode;
    /**
     * 
     */
    message: string;
    /**
     * On `min_amount_not_met`, where the aggregator can price it: the
     * smallest source amount it quotes the route at now, in US dollars,
     * two places, rounded up -- with headroom for the price and the gas
     * to move within a quote's life, so asking again with that much is
     * quoted. Today only `relay` deposits into Lighter say.
     * 
     */
    minAmountUsd?: string;
    /**
     * On `min_amount_not_met`, where known: what the source amount asked
     * for would have delivered, in US dollars, two places, rounded down.
     * "0.00" when it does not even cover the fixed costs.
     * 
     */
    expectedAmountUsd?: string;
}



/**
 * Why an aggregator produced no route, in our own vocabulary. The
 * aggregator's own code is not passed through; it stays in `message`,
 * which carries the upstream text verbatim after our prefix.
 * 
 * swapsxyz answers with `{"success": false, "error": {"code", "name",
 * "message", "statusCode", "details"}}`, and its codes fold in as
 * follows:
 * 
 * * `no_route` — `NO_AVAILABLE_ROUTE`, `INSUFFICIENT_LIQUIDITY`,
 *   `UNSUPPORTED_NETWORK`, `UNSUPPORTED_NETWORK_PAIR`,
 *   `UNSUPPORTED_NETWORK_TOKEN_PAIR`, `UNSUPPORTED_SWAP_DIRECTION`,
 *   `INVALID_SOURCE_TOKEN`, `INVALID_DESTINATION_TOKEN`. The pair, the
 *   direction or the size has nothing to route; another aggregator may
 *   still answer.
 * * `min_amount_not_met` — `AMOUNT_TOO_LOW`, and `INVALID_PARAMETER`
 *   on `amount` whose reason is a lower bound. `AMOUNT_TOO_HIGH`,
 *   `AMOUNT_INVALID`, `INVALID_AMOUNT_ZERO`, `EXCESSIVE_FEE`,
 *   `EXCESSIVE_RELAYER_FEE` join it when upstream words them as a bound
 *   on the amount, and otherwise arrive as `provider_error`, so treat
 *   the message as the detail.
 * * `country_blocked` — `GEO_BLOCKED`, a 403 keyed on the caller's IP.
 *   Since we call swapsxyz server-side that is our egress, not the
 *   user's location, so it means the aggregator is unreachable for
 *   everyone rather than for this user.
 * * `provider_unavailable` — HTTP 429 and any 5xx, including
 *   `INTERNAL_SERVER_ERROR`, plus transport timeouts. Retryable.
 * * `provider_error` — everything else: `INVALID_ADDRESS_FORMAT`,
 *   `INVALID_PARAMETER`, `CROSS_VM_RECEIVER_REQUIRED`,
 *   `MISSING_REQUIRED_FIELD`, `METHOD_NOT_ALLOWED`, `INVALID_API_KEY`,
 *   `MISSING_API_KEY`. For `INVALID_PARAMETER` the message names the
 *   parameter and upstream's reason.
 * 
 * * `insufficient_balance` — the sender holds less of the source asset
 *   than the quote spends. Only a quote that reads the sender's balance
 *   reports it: today relay's Bitcoin quote, which builds its
 *   transaction out of the sender's own outputs and so has nothing to
 *   spend from an empty address. More funds or a smaller amount fixes
 *   it; a retry does not.
 * 
 * * `wallet_screened` — `WALLET_SCREENED`, the aggregator's compliance
 *   check refusing the sender or the recipient. An AML block on the
 *   wallet itself, not a malformed address: the user cannot fix it by
 *   correcting anything, and a retry, another route or another
 *   aggregator is refused the same way. Terminal — send the user to
 *   support rather than to a retry.
 * 
 *   It reaches a quote only with `include_payload: true`, because
 *   swapsxyz prices against placeholder addresses and screens the real
 *   ones only when it builds the transaction. The route is still listed,
 *   since it priced, but it arrives with no `payloads` and cannot be
 *   signed. Without `include_payload` the refusal surfaces on
 *   `POST /v2/crosschain/routes/{route_id}/prepare` as a `400` with the
 *   same code.
 * 
 * Except for `wallet_screened`, these codes are reported by a quote
 * only. Prepare fails the whole request instead: the address family
 * (`GEO_BLOCKED`, `INVALID_ADDRESS_FORMAT`, `CROSS_VM_RECEIVER_REQUIRED`,
 * `INVALID_PARAMETER` on an address) becomes `invalid_address`, an
 * amount under the minimum `min_amount_not_met`, the rest of the amount
 * family `insufficient_balance`, any other `INVALID_PARAMETER`
 * `provider_rejected`, 429 and 5xx `provider_unavailable`.
 * 
 * @export
 */
export const CrossSwapProviderErrorCode = {
    NoRoute: 'no_route',
    AssetNotSupported: 'asset_not_supported',
    MinAmountNotMet: 'min_amount_not_met',
    CountryBlocked: 'country_blocked',
    WalletScreened: 'wallet_screened',
    InsufficientBalance: 'insufficient_balance',
    ProviderUnavailable: 'provider_unavailable',
    ProviderError: 'provider_error',
} as const;
export type CrossSwapProviderErrorCode = typeof CrossSwapProviderErrorCode[keyof typeof CrossSwapProviderErrorCode];

/**
 * 
 * @export
 * @interface CrossSwapQuote
 */
export interface CrossSwapQuote {
    /**
     * Identifier of this quote, used for telemetry and prepare correlation
     */
    quoteId: string;
    /**
     * 
     */
    routes: Array<CrossSwapRoute>;
    /**
     * Errors returned by aggregators that yielded no usable route. A
     * `wallet_screened` entry is the exception that can accompany a
     * listed route: with `include_payload: true` the route priced but
     * its payloads could not be built, so it is present and unsignable.
     * 
     */
    providerErrors?: Array<CrossSwapProviderError>;
}

/**
 * 
 * @export
 */
export const CrossSwapRiskLevel = {
    Low: 'low',
    Medium: 'medium',
    High: 'high',
} as const;
export type CrossSwapRiskLevel = typeof CrossSwapRiskLevel[keyof typeof CrossSwapRiskLevel];

/**
 * 
 * @export
 * @interface CrossSwapRoute
 */
export interface CrossSwapRoute {
    /**
     * 
     */
    routeId: string;
    /**
     * The aggregator's own identifier for this route, passed through
     * verbatim: swapkit `routeId`, omniston `quoteId`. Interpret it
     * together with `aggregator`. Omitted when the provider does not
     * expose one.
     * 
     * swapsxyz and relay price a quote without an identifier, so at
     * quote time this is an id of ours. The swapsxyz `txId` only exists
     * once the transaction is built: with `include_payload: true` the
     * route carries the `txId` here, otherwise it arrives as
     * `provider_route_id` on the prepare response.
     * 
     */
    providerRouteId?: string;
    /**
     * 
     */
    aggregator: CrossSwapAggregator;
    /**
     * Underlying protocol or DEX that actually executes the swap (provider-driven, free-form).
     */
    protocol?: string;
    /**
     * 
     */
    routeType: CrossSwapRouteType;
    /**
     * Raw base-units amount the user is paying. For `exact_input` it is
     * echoed back from the quote request; for `exact_output` it is the
     * provider's expected input, exclusive of slippage.
     * 
     */
    sourceAmount?: string;
    /**
     * Raw base-units cap on what the user may pay, inclusive of
     * slippage. Present only for `exact_output` quotes.
     * 
     */
    maximumSourceAmount?: string;
    /**
     * Raw base-units amount the user is expected to receive. For
     * `exact_output` it equals the requested `destination_amount`, or
     * within TON is at least it (see `CrossSwapExactType`).
     * 
     */
    estimatedDestinationAmount: string;
    /**
     * 
     */
    minimumDestinationAmount: string;
    /**
     * 
     */
    estimatedTime?: CrossSwapTimeEstimate;
    /**
     * Aggregate slippage across all legs (bps)
     */
    totalSlippageBps?: number;
    /**
     * USD value difference between input and output, in basis points
     * (1% = 100 bps, so -300 = -3%). Negative means the user receives
     * less USD than they pay. Omitted when |bps| < 300 or USD prices
     * are unavailable.
     * 
     */
    valueDifferenceBps?: number;
    /**
     * Provider-estimated price impact of the trade, in basis points
     * (1% = 100 bps). Higher = more slippage vs mid-market. Omitted
     * when the provider cannot estimate it (e.g. HTLC orders, low
     * liquidity paths).
     * 
     */
    priceImpactBps?: number;
    /**
     * USD price of one whole source-asset unit at quote time. Omitted when unknown
     */
    sourceUsdPrice?: number;
    /**
     * USD price of one whole destination-asset unit at quote time. Omitted when unknown
     */
    destinationUsdPrice?: number;
    /**
     * Aggregator-assigned highlights (e.g. fastest, cheapest)
     */
    tags?: Array<CrossSwapRouteTag>;
    /**
     * 
     */
    warnings?: Array<string>;
    /**
     * 
     */
    fees?: Array<CrossSwapFee>;
    /**
     * 
     */
    legs: Array<CrossSwapLeg>;
    /**
     * 
     */
    dateExpire: string;
    /**
     * 
     */
    riskLevel: CrossSwapRiskLevel;
    /**
     * Signing payloads for this route, prepared inline. Present only
     * when the quote request had `include_payload: true` and the
     * provider's prepare step succeeded. When present the client can
     * sign and call `/v2/swap/payload/{payload_id}/submit` directly,
     * skipping the separate `/v2/swap/route/{route_id}/prepare`.
     * 
     */
    payloads?: Array<CrossSwapPayload>;
    /**
     * The execution opened for this route by the inline prepare, when
     * the provider can follow the route before a payload is submitted
     * (a `relay` deposit, tracked by the id it was quoted under). Absent
     * otherwise: submit the signed payload to get one.
     * 
     */
    executionId?: string;
    /**
     * 
     */
    changePubKeySigning?: CrossSwapChangePubKeySigning;
}



/**
 * 
 * @export
 */
export const CrossSwapRouteTag = {
    Fastest: 'fastest',
    Recommended: 'recommended',
    Cheapest: 'cheapest',
} as const;
export type CrossSwapRouteTag = typeof CrossSwapRouteTag[keyof typeof CrossSwapRouteTag];


/**
 * 
 * @export
 */
export const CrossSwapRouteType = {
    CrossChainSwap: 'cross_chain_swap',
    SameChainSwap: 'same_chain_swap',
    Bridge: 'bridge',
} as const;
export type CrossSwapRouteType = typeof CrossSwapRouteType[keyof typeof CrossSwapRouteType];

/**
 * 
 * @export
 * @interface CrossSwapSlippage
 */
export interface CrossSwapSlippage {
    /**
     * Slippage options keyed by source-chain identifier (see `CrossSwapChain` enum,
     * e.g. `ton`, `eth`, `btc`). Chains absent from this map fall through to a
     * wallet-side default of 100 bps.
     * 
     */
    chains: { [key: string]: CrossSwapSlippageOptions; };
    /**
     * 
     */
    defaultPair?: CrossSwapDefaultPair;
}
/**
 * 
 * @export
 * @interface CrossSwapSlippageOptions
 */
export interface CrossSwapSlippageOptions {
    /**
     * Slippage options the wallet should show, ascending. Values are in basis points (100 bps = 1%)
     */
    optionsBps: Array<number>;
    /**
     * Default selected option, in basis points
     */
    defaultBps: number;
}

/**
 * A balance the source asset is taken out of, instead of the sender's
 * wallet. `sender_address` then names the account in it. The reverse of
 * a `destination_target`.
 * `lighter`: the USDC collateral of a Lighter perps account -- a
 * withdrawal. `source_asset` is USDC on Ethereum
 * (`eth/mainnet/erc20/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`), the
 * asset a lighter deposit lands as, and `sender_address` the account
 * index, in decimal. `destination_asset` is any asset `relay` delivers
 * from Lighter -- quoted today to `ton`, `eth`, `bsc`, `base`, `arb`,
 * `tron` and `btc` -- and `recipient_address` the wallet on its chain.
 * Nothing leaves Lighter to L1: the one payload is a Lighter transfer of
 * the collateral into relay's account there (`lighter_transfer`), and
 * relay pays out on the destination chain.
 * 
 * @export
 */
export const CrossSwapSourceTarget = {
    Lighter: 'lighter',
} as const;
export type CrossSwapSourceTarget = typeof CrossSwapSourceTarget[keyof typeof CrossSwapSourceTarget];

/**
 * A route read back from storage, flattened together with the quote it
 * came from. The asset fields and `slippage_bps` belong to the quote and
 * are shared by its other routes; everything else is this route's own.
 * 
 * @export
 * @interface CrossSwapStoredRoute
 */
export interface CrossSwapStoredRoute {
    /**
     * 
     */
    routeId: string;
    /**
     * Identifier of the quote this route was returned by
     */
    quoteId: string;
    /**
     * 
     */
    exactType: CrossSwapExactType;
    /**
     * Canonical asset id the user pays with
     */
    sourceAsset: string;
    /**
     * Raw base-units amount this route spends. For `exact_input` it is
     * what the quote asked for; for `exact_output` it is the provider's
     * own expected input, read from the route's first leg. Omitted when
     * neither is known.
     * 
     */
    sourceAmount?: string;
    /**
     * Canonical asset id the user receives
     */
    destinationAsset: string;
    /**
     * Raw base-units amount the quote asked to receive. Present only for
     * `exact_output` quotes; otherwise the route's own
     * `estimated_destination_amount` is the answer.
     * 
     */
    destinationAmount?: string;
    /**
     * Raw base-units amount this route was expected to deliver
     */
    estimatedDestinationAmount: string;
    /**
     * Slippage-protected floor, when the provider gave one
     */
    minimumDestinationAmount?: string;
    /**
     * Aggregator that produced the route. Free-form rather than the
     * `CrossSwapAggregator` enum, so routes written by an aggregator
     * that has since been retired still read back.
     * 
     */
    aggregator: string;
    /**
     * Underlying protocol or DEX that actually executes the swap (provider-driven, free-form).
     */
    protocol?: string;
    /**
     * The whole chain of protocols the route goes through, in order.
     * `protocol` is the first of them. Omitted for routes stored before
     * the chain was recorded.
     * 
     */
    providers?: Array<string>;
    /**
     * 
     */
    routeType: CrossSwapRouteType;
    /**
     * The aggregator's own identifier for this route as it was quoted.
     * For swapsxyz and relay this is an id of ours; the swapsxyz `txId`
     * is only minted when the transaction is built.
     * 
     */
    providerRouteId?: string;
    /**
     * 
     */
    estimatedDurationSeconds?: number;
    /**
     * USD value difference between input and output at quote time, in
     * basis points. Negative means the user receives less USD than they
     * pay.
     * 
     */
    valueDifferenceBps?: number;
    /**
     * 
     */
    riskLevel?: CrossSwapRiskLevel;
    /**
     * Slippage tolerance the quote was priced with (bps)
     */
    slippageBps: number;
    /**
     * 
     */
    dateExpire: string;
    /**
     * When the route was quoted
     */
    dateCreate: string;
}


/**
 * 
 * @export
 * @interface CrossSwapSubmit
 */
export interface CrossSwapSubmit {
    /**
     * 
     */
    executionId: string;
    /**
     * 
     */
    sourceTxHash?: string;
    /**
     * 
     */
    status: CrossSwapExecutionStatus;
}


/**
 * Per-stage time estimate breakdown. Stages may be 0 when not applicable (e.g. no inbound confirmation needed)
 * @export
 * @interface CrossSwapTimeEstimate
 */
export interface CrossSwapTimeEstimate {
    /**
     * Time to confirm the source-chain tx
     */
    inboundSeconds?: number;
    /**
     * Time spent inside the swap protocol
     */
    swapSeconds?: number;
    /**
     * Time to confirm the destination-chain tx
     */
    outboundSeconds?: number;
    /**
     * 
     */
    totalSeconds?: number;
}

/**
 * 
 * @export
 */
export const CrossSwapValidationStatus = {
    Validated: 'validated',
    Pending: 'pending',
    Rejected: 'rejected',
} as const;
export type CrossSwapValidationStatus = typeof CrossSwapValidationStatus[keyof typeof CrossSwapValidationStatus];

/**
 * An EIP-7702 authorization tuple, signed by the account owner over
 * `keccak(0x05 || rlp([chain_id, address, nonce]))`. It is forwarded to
 * the aggregator unchanged and lands in the fill transaction.
 * The nonce is the owner's own nonce on the destination chain, checked
 * against the chain when the quote is made: the solver sends the
 * transaction, so the nonce is untouched at execution time, and any
 * transaction the owner sends in between invalidates the authorization.
 * 
 * @export
 * @interface EIP7702Authorization
 */
export interface EIP7702Authorization {
    /**
     * The chain the delegation applies to. 1 (Ethereum) here; 0 (any chain) is refused.
     */
    chainId: number;
    /**
     * The delegate the EOA's code is set to. Must be the delegate this service pins.
     */
    address: string;
    /**
     * The owner's nonce on that chain when the authorization was signed.
     * Optional: absent, the chain's is taken. Either way the signature
     * has to recover to the owner over it.
     * 
     */
    nonce?: number;
    /**
     * 
     */
    yParity: number;
    /**
     * 
     */
    r: string;
    /**
     * 
     */
    s: string;
}
/**
 * 
 * @export
 * @interface ErrorResponse
 */
export interface ErrorResponse {
    /**
     * Human-readable message. Sanitised — never reveals internal details.
     */
    error: string;
    /**
     * Stable machine-readable error code. Optional on 5xx (server may not
     * know the cause). Mandatory on 4xx where the client can act.
     * 
     */
    code?: string;
    /**
     * UUID v4 for correlating the response to server logs.
     */
    requestId: string;
}
/**
 * 
 * @export
 * @interface ExchangeAsset
 */
export interface ExchangeAsset {
    /**
     * 
     */
    slug: string;
    /**
     * 
     */
    type: ExchangeAssetType;
    /**
     * 
     */
    inputMethods: Array<ExchangeMethod>;
    /**
     * 
     */
    outputMethods: Array<ExchangeMethod>;
    /**
     * 
     */
    image?: string;
    /**
     * 
     */
    decimals?: number;
    /**
     * 
     */
    stablecoin?: boolean;
}



/**
 * 
 * @export
 */
export const ExchangeAssetType = {
    Fiat: 'fiat',
    Crypto: 'crypto',
} as const;
export type ExchangeAssetType = typeof ExchangeAssetType[keyof typeof ExchangeAssetType];

/**
 * 
 * @export
 * @interface ExchangeAvailablePair
 */
export interface ExchangeAvailablePair {
    /**
     * 
     */
    merchant: ExchangeMerchantSlug;
    /**
     * 
     */
    direction: ExchangeDirection;
    /**
     * 
     */
    cryptoCurrency: string;
    /**
     * 
     */
    cryptoNetwork: string;
    /**
     * 
     */
    fiatCurrency: string;
    /**
     * 
     */
    limits?: ExchangeLimits;
    /**
     * 
     */
    paymentMethods?: Array<ExchangePaymentMethodType>;
}


/**
 * 
 * @export
 * @interface ExchangeCalculateRequest
 */
export interface ExchangeCalculateRequest {
    /**
     * Source currency code
     */
    from: string;
    /**
     * Target currency code
     */
    to: string;
    /**
     * Crypto network. Deprecated: use from_network and to_network instead
     * @deprecated
     */
    network?: string;
    /**
     * Source crypto network (required for sell and swap)
     */
    fromNetwork?: string;
    /**
     * Target crypto network (required for buy and swap)
     */
    toNetwork?: string;
    /**
     * Amount to exchange
     */
    amount: string;
    /**
     * User wallet address
     */
    wallet: string;
    /**
     * 
     */
    purchaseType: ExchangeDirection;
    /**
     * User country code (ISO 3166-1 alpha-2). Deprecated: use device_country_code and store_country_code query parameters instead
     * @deprecated
     */
    country?: string;
    /**
     * 
     */
    paymentMethod?: ExchangePaymentMethodType;
    /**
     * When true, amount is interpreted as target crypto amount instead of source amount
     */
    reverse?: boolean;
    /**
     * 
     */
    flow?: ExchangeFlow;
}


/**
 * 
 * @export
 * @interface ExchangeCalculation
 */
export interface ExchangeCalculation {
    /**
     * 
     */
    items: Array<ExchangeQuote>;
    /**
     * 
     */
    suggested: Array<ExchangeQuote>;
}
/**
 * 
 * @export
 * @interface ExchangeCurrencies
 */
export interface ExchangeCurrencies {
    /**
     * 
     */
    assets: Array<ExchangeAsset>;
    /**
     * 
     */
    merchants: Array<ExchangeMerchant>;
    /**
     * 
     */
    allowedPairs: Array<ExchangePair>;
}
/**
 * 
 * @export
 * @interface ExchangeCurrencyInfo
 */
export interface ExchangeCurrencyInfo {
    /**
     * 
     */
    symbol: string;
    /**
     * Blockchain network (e.g. native, jetton, erc-20)
     */
    network?: string;
}

/**
 * 
 * @export
 */
export const ExchangeDirection = {
    Buy: 'buy',
    Sell: 'sell',
    Swap: 'swap',
} as const;
export type ExchangeDirection = typeof ExchangeDirection[keyof typeof ExchangeDirection];


/**
 * 
 * @export
 */
export const ExchangeFlow = {
    Deposit: 'deposit',
    Withdraw: 'withdraw',
} as const;
export type ExchangeFlow = typeof ExchangeFlow[keyof typeof ExchangeFlow];

/**
 * 
 * @export
 * @interface ExchangeLayout
 */
export interface ExchangeLayout {
    /**
     * 
     */
    items: Array<ExchangeLayoutItem>;
}
/**
 * 
 * @export
 * @interface ExchangeLayoutAsset
 */
export interface ExchangeLayoutAsset {
    /**
     * 
     */
    symbol: string;
    /**
     * Internal asset identifier (e.g. `ton/mainnet/coin`, `eth/mainnet/erc20/0xdc03...`, `ton/mainnet/jetton/0:b113...`)
     */
    assetId: string;
    /**
     * 
     */
    network: string;
    /**
     * 
     */
    networkName: string;
    /**
     * 
     */
    networkImage: string;
    /**
     * 
     */
    image: string;
    /**
     * 
     */
    address?: string;
    /**
     * 
     */
    decimals: number;
    /**
     * 
     */
    stablecoin: boolean;
    /**
     * 
     */
    cashMethods: Array<ExchangeLayoutCashMethod>;
    /**
     * 
     */
    cryptoMethods: Array<ExchangeLayoutCryptoMethod>;
}
/**
 * 
 * @export
 * @interface ExchangeLayoutCard
 */
export interface ExchangeLayoutCard {
    /**
     * 
     */
    title: string;
    /**
     * 
     */
    description: string;
    /**
     * 
     */
    image: string;
    /**
     * ISO 4217 fiat code suggested to the user
     */
    preferredCurrency?: string;
}
/**
 * 
 * @export
 * @interface ExchangeLayoutCards
 */
export interface ExchangeLayoutCards {
    /**
     * 
     */
    items: Array<ExchangeLayoutCard>;
}
/**
 * 
 * @export
 * @interface ExchangeLayoutCashMethod
 */
export interface ExchangeLayoutCashMethod {
    /**
     * 
     */
    type: ExchangePaymentMethodType;
    /**
     * 
     */
    name: string;
    /**
     * 
     */
    image: string;
    /**
     * 
     */
    providers: Array<ExchangeLayoutProvider>;
}


/**
 * 
 * @export
 * @interface ExchangeLayoutCryptoMethod
 */
export interface ExchangeLayoutCryptoMethod {
    /**
     * Source crypto symbol (e.g. BTC, USDT)
     */
    symbol: string;
    /**
     * Internal asset identifier (e.g. `ton/mainnet/coin`, `eth/mainnet/erc20/0xdc03...`, `ton/mainnet/jetton/0:b113...`)
     */
    assetId: string;
    /**
     * 
     */
    network: string;
    /**
     * 
     */
    networkName: string;
    /**
     * 
     */
    networkImage: string;
    /**
     * 
     */
    image: string;
    /**
     * 
     */
    address?: string;
    /**
     * 
     */
    decimals: number;
    /**
     * 
     */
    stablecoin: boolean;
    /**
     * Withdrawal fee in USD (for stablecoins)
     */
    fee?: number;
    /**
     * Minimum withdrawal amount in USD (for stablecoins)
     */
    minAmount?: number;
    /**
     * 
     */
    providers: Array<ExchangeLayoutProvider>;
}
/**
 * 
 * @export
 * @interface ExchangeLayoutItem
 */
export interface ExchangeLayoutItem {
    /**
     * 
     */
    type: ExchangeLayoutItemType;
    /**
     * 
     */
    title: string;
    /**
     * 
     */
    description: string;
    /**
     * 
     */
    image: string;
    /**
     * 
     */
    preferredCurrency?: string;
    /**
     * 
     */
    assets?: Array<ExchangeLayoutAsset>;
}



/**
 * 
 * @export
 */
export const ExchangeLayoutItemType = {
    Fiat: 'fiat',
    Crypto: 'crypto',
    Stablecoin: 'stablecoin',
} as const;
export type ExchangeLayoutItemType = typeof ExchangeLayoutItemType[keyof typeof ExchangeLayoutItemType];

/**
 * 
 * @export
 * @interface ExchangeLayoutProvider
 */
export interface ExchangeLayoutProvider {
    /**
     * 
     */
    slug: ExchangeMerchantSlug;
    /**
     * 
     */
    limits?: ExchangeLimits;
}


/**
 * 
 * @export
 * @interface ExchangeLimits
 */
export interface ExchangeLimits {
    /**
     * 
     */
    min?: number;
    /**
     * 
     */
    max?: number;
}
/**
 * 
 * @export
 * @interface ExchangeMerchant
 */
export interface ExchangeMerchant {
    /**
     * 
     */
    name: string;
    /**
     * 
     */
    slug: ExchangeMerchantSlug;
    /**
     * 
     */
    inputMethods: Array<string>;
    /**
     * 
     */
    outputMethods: Array<string>;
}


/**
 * 
 * @export
 * @interface ExchangeMerchantInfo
 */
export interface ExchangeMerchantInfo {
    /**
     * 
     */
    id: string;
    /**
     * 
     */
    title: string;
    /**
     * 
     */
    description: string;
    /**
     * 
     */
    image: string;
    /**
     * 
     */
    fee: number;
    /**
     * 
     */
    buttons: Array<ExchangeMerchantInfoButton>;
}
/**
 * 
 * @export
 * @interface ExchangeMerchantInfoButton
 */
export interface ExchangeMerchantInfoButton {
    /**
     * 
     */
    title: string;
    /**
     * 
     */
    url: string;
}

/**
 * 
 * @export
 */
export const ExchangeMerchantSlug = {
    Mercuryo: 'mercuryo',
    Transak: 'transak',
    Moonpay: 'moonpay',
    Avanchange: 'avanchange',
    Changelly: 'changelly',
    Wallet: 'wallet',
} as const;
export type ExchangeMerchantSlug = typeof ExchangeMerchantSlug[keyof typeof ExchangeMerchantSlug];

/**
 * 
 * @export
 * @interface ExchangeMethod
 */
export interface ExchangeMethod {
    /**
     * 
     */
    type: string;
    /**
     * 
     */
    address?: string;
}
/**
 * 
 * @export
 * @interface ExchangePair
 */
export interface ExchangePair {
    /**
     * 
     */
    from: ExchangeCurrencyInfo;
    /**
     * 
     */
    to: ExchangeCurrencyInfo;
    /**
     * 
     */
    merchants: Array<ExchangeSimpleMerchant>;
}
/**
 * 
 * @export
 * @interface ExchangePairs
 */
export interface ExchangePairs {
    /**
     * 
     */
    count: number;
    /**
     * 
     */
    pairs: Array<ExchangeAvailablePair>;
}
/**
 * 
 * @export
 * @interface ExchangePaymentMethod
 */
export interface ExchangePaymentMethod {
    /**
     * 
     */
    merchant: ExchangeMerchantSlug;
    /**
     * 
     */
    methods: Array<ExchangePaymentMethodMethodsInner>;
}


/**
 * 
 * @export
 * @interface ExchangePaymentMethodMethodsInner
 */
export interface ExchangePaymentMethodMethodsInner {
    /**
     * 
     */
    type: ExchangePaymentMethodType;
    /**
     * 
     */
    image: string;
}



/**
 * 
 * @export
 */
export const ExchangePaymentMethodType = {
    Card: 'card',
    CardMir: 'card_mir',
    ApplePay: 'apple_pay',
    GooglePay: 'google_pay',
    Paypal: 'paypal',
    Sepa: 'sepa',
    Venmo: 'venmo',
    Revolut: 'revolut',
    Pix: 'pix',
    Volt: 'volt',
    P2p: 'p2p',
    Ach: 'ach',
} as const;
export type ExchangePaymentMethodType = typeof ExchangePaymentMethodType[keyof typeof ExchangePaymentMethodType];

/**
 * 
 * @export
 * @interface ExchangeQuote
 */
export interface ExchangeQuote {
    /**
     * 
     */
    merchant: ExchangeMerchantSlug;
    /**
     * 
     */
    amount: number;
    /**
     * Source amount the user needs to pay (present when reverse=true)
     */
    fromAmount?: number;
    /**
     * 
     */
    widgetUrl?: string;
    /**
     * 
     */
    minAmount?: number;
    /**
     * 
     */
    maxAmount?: number;
    /**
     * 
     */
    merchantTransactionId: string;
}


/**
 * 
 * @export
 * @interface ExchangeResult
 */
export interface ExchangeResult {
    /**
     * 
     */
    id: string;
    /**
     * 
     */
    payinAddress: string;
    /**
     * Memo / Destination Tag the user must include with the deposit transfer (when required by the source chain)
     */
    payinExtraId?: string;
    /**
     * Human-readable name of the extra id required at the destination (e.g. "Destination Tag", "Memo"). Empty when not required
     */
    extraIdName?: string;
    /**
     * 
     */
    amountExpectedFrom: number;
    /**
     * 
     */
    amountExpectedTo: number;
    /**
     * 
     */
    status: string;
    /**
     * 
     */
    minDeposit: number;
    /**
     * 
     */
    maxDeposit: number;
    /**
     * 
     */
    rate: number;
    /**
     * Estimated exchange duration in seconds
     */
    estimatedDuration: number;
}
/**
 * 
 * @export
 * @interface ExchangeSimpleMerchant
 */
export interface ExchangeSimpleMerchant {
    /**
     * 
     */
    slug: ExchangeMerchantSlug;
    /**
     * 
     */
    limits?: ExchangeLimits;
}


/**
 * 
 * @export
 * @interface GetCrossSwapAsset404Response
 */
export interface GetCrossSwapAsset404Response {
    /**
     * Human-readable message, safe to show the user
     */
    error: string;
    /**
     * Stable machine-readable code — clients should branch on this.
     * `route_not_found` means the route id is gone, from this
     * service or from the aggregator; ask for a fresh quote.
     * 
     */
    code: string;
    /**
     * UUID v4 for correlating the response to server logs
     */
    requestId: string;
}
/**
 * 
 * @export
 * @interface Healthcheck500Response
 */
export interface Healthcheck500Response {
    /**
     * Generic sanitised message, never reveals internal details
     */
    error: string;
    /**
     * 
     */
    code?: string;
    /**
     * UUID v4 for correlating the response to server logs
     */
    requestId: string;
}
/**
 * The owner's EIP-712 signature letting the solver run the changePubKey
 * call through the delegated EOA (HermesDelegateV1's signed batch mode).
 * Signed over
 * `Execute(bytes32 mode,Call[] calls,uint256 nonce,uint256 deadline)`
 * with `Call(address target,uint256 value,bytes data)`, in the domain
 * `{name: "Hermes", version: "v1.0.0", chainId: 1, verifyingContract:
 * <the owner's address>, salt: <the delegate, left-padded to 32 bytes>}`,
 * where `mode` is
 * `0x0100000000007821000100000000000000000000000000000000000000000000`
 * and `calls` is the one call
 * `{target: <Lighter gateway 0x3b4d794a66304f130a4db8f2551b0070dfcf5ca7>,
 * value: 0, data: changePubKey(account_index, api_key_index, pub_key)}`.
 * Checked when the quote is made: a signature that does not recover to
 * the owner over that call, or a stale nonce, would revert the fill and
 * the deposit with it.
 * 
 * @export
 * @interface HermesExecuteSignature
 */
export interface HermesExecuteSignature {
    /**
     * The owner's nonce at the delegate's nonce manager
     * (`HermesV1.nonceOf(owner)`), consumed by the fill. Any other signed
     * batch of the owner's in between invalidates the signature.
     * Optional: absent, the chain's is taken, and the signature has to
     * recover to the owner over it.
     * 
     */
    nonce?: number;
    /**
     * Unix seconds after which the signature no longer validates;
     * between 5 minutes and 24 hours ahead. The signature stays usable
     * until then if the fill fails, so keep it short.
     * 
     */
    deadline: number;
    /**
     * r || s || v, v 27 or 28.
     */
    signature: string;
}
/**
 * Slim asset entry for the off-ramp configuration list.
 * Provider/method matrix lives at `GET /v2/offramp/asset?asset_id=...`.
 * 
 * @export
 * @interface OfframpAsset
 */
export interface OfframpAsset {
    /**
     * `{chain}/{net}/coin` for natives, `{chain}/{net}/jetton|token/{addr}` for tokens
     */
    assetId: string;
    /**
     * 
     */
    symbol: string;
    /**
     * Human-readable asset name (e.g. "Bitcoin", "Tether")
     */
    name?: string;
    /**
     * 
     */
    networkName?: string;
    /**
     * 
     */
    networkImage?: string;
    /**
     * 
     */
    image?: string;
    /**
     * 
     */
    decimals: number;
    /**
     * 
     */
    stablecoin: boolean;
    /**
     * Source chain needs a Memo / Destination Tag on the deposit
     */
    extraIdRequired: boolean;
    /**
     * Form label (e.g. "Memo", "Destination Tag")
     */
    extraIdName?: string;
    /**
     * Payout method types supported for this asset in the current country
     */
    availablePayoutMethods: Array<ExchangePaymentMethodType>;
    /**
     * Fiat codes (ISO 4217) supported for this asset in the current country
     */
    availableFiats: Array<string>;
}
/**
 * Full per-asset off-ramp configuration including payout methods, providers and limits
 * @export
 * @interface OfframpAssetDetail
 */
export interface OfframpAssetDetail {
    /**
     * 
     */
    assetId: string;
    /**
     * 
     */
    symbol: string;
    /**
     * Human-readable asset name (e.g. "Bitcoin", "Tether")
     */
    name?: string;
    /**
     * 
     */
    networkName?: string;
    /**
     * 
     */
    networkImage?: string;
    /**
     * 
     */
    image?: string;
    /**
     * 
     */
    decimals: number;
    /**
     * 
     */
    stablecoin: boolean;
    /**
     * 
     */
    extraIdRequired: boolean;
    /**
     * 
     */
    extraIdName?: string;
    /**
     * Ordered for display; render as received
     */
    payoutMethods: Array<OfframpPayoutMethod>;
}
/**
 * Off-ramp configuration snapshot. Cacheable via ETag
 * @export
 * @interface OfframpConfiguration
 */
export interface OfframpConfiguration {
    /**
     * 
     */
    assets: Array<OfframpAsset>;
    /**
     * Cursor for the next page. Absent when there are no more pages.
     */
    nextCursor?: string;
}
/**
 * Off-ramp order. Open `widget_url` to complete KYC; the wallet
 * then sends `amount_in` to `payin_address`. Poll until terminal.
 * 
 * @export
 * @interface OfframpOrder
 */
export interface OfframpOrder {
    /**
     * 
     */
    id: string;
    /**
     * 
     */
    merchant: ExchangeMerchantSlug;
    /**
     * 
     */
    merchantTransactionId?: string;
    /**
     * 
     */
    status: OfframpOrderStatus;
    /**
     * Provider detail for terminal states
     */
    statusReason?: string;
    /**
     * 
     */
    widgetUrl: string;
    /**
     * Provider deposit address. Prompt the user to send after status `awaiting_funds`
     */
    payinAddress: string;
    /**
     * Memo / Destination Tag for chains that require it
     */
    payinExtraId?: string;
    /**
     * 
     */
    extraIdName?: string;
    /**
     * 
     */
    amountIn: string;
    /**
     * 
     */
    amountOut: string;
    /**
     * 
     */
    rate: string;
    /**
     * 
     */
    fees: RampFees;
    /**
     * User's deposit tx, populated from `funds_received`
     */
    depositTxHash?: string;
    /**
     * Merchant refund tx
     */
    refundTxHash?: string;
    /**
     * Where the refund was sent
     */
    refundAddress?: string;
    /**
     * Merchant's native order id
     */
    providerOrderId?: string;
    /**
     * Seconds (best-effort)
     */
    estimatedDuration?: number;
    /**
     * 
     */
    dateCreate: string;
    /**
     * 
     */
    dateUpdate?: string;
}



/**
 * Happy path: `created → awaiting_funds → funds_received → completed`.
 * Terminal: `completed`, `failed`, `cancelled`, `expired`, `refunded`.
 * 
 * @export
 */
export const OfframpOrderStatus = {
    Created: 'created',
    AwaitingFunds: 'awaiting_funds',
    FundsReceived: 'funds_received',
    Completed: 'completed',
    Failed: 'failed',
    Cancelled: 'cancelled',
    Expired: 'expired',
    Refunded: 'refunded',
} as const;
export type OfframpOrderStatus = typeof OfframpOrderStatus[keyof typeof OfframpOrderStatus];

/**
 * One payout method (card, sepa, ...) with the providers offering it for this asset
 * @export
 * @interface OfframpPayoutMethod
 */
export interface OfframpPayoutMethod {
    /**
     * 
     */
    type: ExchangePaymentMethodType;
    /**
     * Display name (e.g. "Card", "SEPA")
     */
    name: string;
    /**
     * Image URL for the method
     */
    image: string;
    /**
     * 
     */
    providers: Array<OfframpProvider>;
}


/**
 * A merchant offering this payout method for a given fiat
 * @export
 * @interface OfframpProvider
 */
export interface OfframpProvider {
    /**
     * 
     */
    merchant: ExchangeMerchantSlug;
    /**
     * ISO 4217
     */
    fiat: string;
    /**
     * 
     */
    limits?: ExchangeLimits;
}


/**
 * 
 * @export
 * @interface OfframpQuoteRequest
 */
export interface OfframpQuoteRequest {
    /**
     * 
     */
    sourceAssetId: string;
    /**
     * 
     */
    fiat: string;
    /**
     * Source crypto decimal. When `reverse=true`, target fiat
     */
    amount: string;
    /**
     * 
     */
    reverse?: boolean;
    /**
     * 
     */
    payoutMethod?: ExchangePaymentMethodType;
    /**
     * 
     */
    merchant?: ExchangeMerchantSlug;
}


/**
 * Single merchant's off-ramp quote
 * @export
 * @interface OfframpQuoteResult
 */
export interface OfframpQuoteResult {
    /**
     * 
     */
    merchant: ExchangeMerchantSlug;
    /**
     * 
     */
    payoutMethod: ExchangePaymentMethodType;
    /**
     * Source crypto the user pays
     */
    amountIn: string;
    /**
     * Fiat the user receives, net of fees
     */
    amountOut: string;
    /**
     * `amount_out / amount_in`
     */
    rate: string;
    /**
     * 
     */
    fees: RampFees;
    /**
     * Min amount, in the same currency as the requested `amount` (crypto, or fiat when `reverse=true`)
     */
    minAmount?: string;
    /**
     * Max amount, in the same currency as the requested `amount` (crypto, or fiat when `reverse=true`)
     */
    maxAmount?: string;
    /**
     * Rate guarantee expiry
     */
    dateExpire: string;
    /**
     * Pass to POST /v2/offramp/orders to pin this rate
     */
    merchantTransactionId: string;
}


/**
 * Multi-merchant quote. `items` sorted by `amount_out` desc
 * @export
 * @interface OfframpQuotes
 */
export interface OfframpQuotes {
    /**
     * 
     */
    items: Array<OfframpQuoteResult>;
    /**
     * 
     */
    suggested: Array<OfframpQuoteResult>;
    /**
     * 
     */
    unavailableReason?: RampUnavailableReason;
}


/**
 * 
 * @export
 * @interface Ok
 */
export interface Ok {
    /**
     * 
     */
    ok: boolean;
}
/**
 * 
 * @export
 * @interface OmnistonSwapMessages
 */
export interface OmnistonSwapMessages {
    /**
     * 
     */
    messages: Array<TonMessage>;
    /**
     * 
     */
    quoteId: string;
    /**
     * 
     */
    resolverName: string;
    /**
     * 
     */
    askUnits: string;
    /**
     * Amount of bid asset the trader must pay, including all fees
     */
    bidUnits: string;
    /**
     * Amount of fees charged by the protocol
     */
    protocolFeeUnits: string;
    /**
     * Max timestamp (UTC seconds) for trade start
     */
    tradeStartDeadline: string;
    /**
     * Total gas budget required
     */
    gasBudget: string;
    /**
     * Estimated gas units to be spent
     */
    estimatedGasConsumption: string;
    /**
     * 
     */
    slippage: number;
    /**
     * USD value difference between input and output, in basis points
     * (1% = 100 bps, so -300 = -3%). Negative means the user receives
     * less USD than they pay. Omitted when |bps| < 300 or USD prices
     * are unavailable.
     * 
     */
    valueDifferenceBps?: number;
}
/**
 * Slim asset entry for the on-ramp configuration list.
 * Provider/method matrix lives at `GET /v2/onramp/asset?asset_id=...`.
 * 
 * @export
 * @interface OnrampAsset
 */
export interface OnrampAsset {
    /**
     * `{chain}/{net}/coin` for natives, `{chain}/{net}/jetton|token/{addr}` for tokens
     */
    assetId: string;
    /**
     * 
     */
    symbol: string;
    /**
     * Human-readable asset name (e.g. "Bitcoin", "Tether")
     */
    name?: string;
    /**
     * 
     */
    networkName?: string;
    /**
     * 
     */
    networkImage?: string;
    /**
     * 
     */
    image?: string;
    /**
     * 
     */
    decimals: number;
    /**
     * 
     */
    stablecoin: boolean;
    /**
     * Destination chain needs a Memo / Destination Tag
     */
    extraIdRequired: boolean;
    /**
     * Form label (e.g. "Memo", "Destination Tag")
     */
    extraIdName?: string;
    /**
     * Payment method types supported for this asset in the current country
     */
    availableMethods: Array<ExchangePaymentMethodType>;
    /**
     * Fiat codes (ISO 4217) supported for this asset in the current country
     */
    availableFiats: Array<string>;
}
/**
 * Full per-asset on-ramp configuration including payment methods, providers and limits
 * @export
 * @interface OnrampAssetDetail
 */
export interface OnrampAssetDetail {
    /**
     * 
     */
    assetId: string;
    /**
     * 
     */
    symbol: string;
    /**
     * Human-readable asset name (e.g. "Bitcoin", "Tether")
     */
    name?: string;
    /**
     * 
     */
    networkName?: string;
    /**
     * 
     */
    networkImage?: string;
    /**
     * 
     */
    image?: string;
    /**
     * 
     */
    decimals: number;
    /**
     * 
     */
    stablecoin: boolean;
    /**
     * 
     */
    extraIdRequired: boolean;
    /**
     * 
     */
    extraIdName?: string;
    /**
     * Ordered for display; render as received
     */
    paymentMethods: Array<OnrampPaymentMethod>;
}
/**
 * Chains with at least one purchasable on-ramp asset. Cacheable via ETag
 * @export
 * @interface OnrampChains
 */
export interface OnrampChains {
    /**
     * 
     */
    chains: Array<string>;
}
/**
 * On-ramp configuration snapshot. Cacheable via ETag
 * @export
 * @interface OnrampConfiguration
 */
export interface OnrampConfiguration {
    /**
     * 
     */
    assets: Array<OnrampAsset>;
    /**
     * Cursor for the next page. Absent when there are no more pages.
     */
    nextCursor?: string;
}
/**
 * On-ramp order. Open `widget_url`; the merchant collects fiat and
 * sends `amount_out` to `destination_address`. Poll until terminal.
 * 
 * @export
 * @interface OnrampOrder
 */
export interface OnrampOrder {
    /**
     * 
     */
    id: string;
    /**
     * 
     */
    merchant: ExchangeMerchantSlug;
    /**
     * 
     */
    merchantTransactionId?: string;
    /**
     * 
     */
    status: OnrampOrderStatus;
    /**
     * Provider detail for terminal states
     */
    statusReason?: string;
    /**
     * 
     */
    widgetUrl: string;
    /**
     * Echo of the value supplied at create time
     */
    destinationAddress: string;
    /**
     * Memo / Destination Tag for chains that require it
     */
    destinationExtraId?: string;
    /**
     * 
     */
    extraIdName?: string;
    /**
     * 
     */
    amountIn: string;
    /**
     * 
     */
    amountOut: string;
    /**
     * 
     */
    rate: string;
    /**
     * 
     */
    fees: RampFees;
    /**
     * Merchant payout tx, populated from `funds_sent`
     */
    destinationTxHash?: string;
    /**
     * Merchant's native order id
     */
    providerOrderId?: string;
    /**
     * Seconds (best-effort)
     */
    estimatedDuration?: number;
    /**
     * 
     */
    dateCreate: string;
    /**
     * 
     */
    dateUpdate?: string;
}



/**
 * Happy path: `created → awaiting_payment → payment_received → funds_sent → completed`.
 * Terminal: `completed`, `failed`, `cancelled`, `expired`, `refunded`.
 * 
 * @export
 */
export const OnrampOrderStatus = {
    Created: 'created',
    AwaitingPayment: 'awaiting_payment',
    PaymentReceived: 'payment_received',
    FundsSent: 'funds_sent',
    Completed: 'completed',
    Failed: 'failed',
    Cancelled: 'cancelled',
    Expired: 'expired',
    Refunded: 'refunded',
} as const;
export type OnrampOrderStatus = typeof OnrampOrderStatus[keyof typeof OnrampOrderStatus];

/**
 * One payment method (card, apple_pay, sepa, ...) with the providers offering it for this asset
 * @export
 * @interface OnrampPaymentMethod
 */
export interface OnrampPaymentMethod {
    /**
     * 
     */
    type: ExchangePaymentMethodType;
    /**
     * Display name (e.g. "Card", "Apple Pay")
     */
    name: string;
    /**
     * Image URL for the method
     */
    image: string;
    /**
     * 
     */
    providers: Array<OnrampProvider>;
}


/**
 * A merchant offering this payment method for a given fiat
 * @export
 * @interface OnrampProvider
 */
export interface OnrampProvider {
    /**
     * 
     */
    merchant: ExchangeMerchantSlug;
    /**
     * ISO 4217
     */
    fiat: string;
    /**
     * 
     */
    limits?: ExchangeLimits;
}


/**
 * 
 * @export
 * @interface OnrampQuoteRequest
 */
export interface OnrampQuoteRequest {
    /**
     * 
     */
    targetAssetId: string;
    /**
     * 
     */
    fiat: string;
    /**
     * Fiat decimal. When `reverse=true`, target crypto
     */
    amount: string;
    /**
     * 
     */
    reverse?: boolean;
    /**
     * 
     */
    paymentMethod?: ExchangePaymentMethodType;
    /**
     * 
     */
    merchant?: ExchangeMerchantSlug;
}


/**
 * Single merchant's on-ramp quote
 * @export
 * @interface OnrampQuoteResult
 */
export interface OnrampQuoteResult {
    /**
     * 
     */
    merchant: ExchangeMerchantSlug;
    /**
     * 
     */
    paymentMethod: ExchangePaymentMethodType;
    /**
     * Fiat the user pays
     */
    amountIn: string;
    /**
     * Crypto the user receives, net of fees
     */
    amountOut: string;
    /**
     * `amount_out / amount_in`
     */
    rate: string;
    /**
     * 
     */
    fees: RampFees;
    /**
     * Min amount, in the same currency as the requested `amount` (fiat, or crypto when `reverse=true`)
     */
    minAmount?: string;
    /**
     * Max amount, in the same currency as the requested `amount` (fiat, or crypto when `reverse=true`)
     */
    maxAmount?: string;
    /**
     * Rate guarantee expiry
     */
    dateExpire: string;
    /**
     * Pass to POST /v2/onramp/orders to pin this rate
     */
    merchantTransactionId: string;
}


/**
 * Multi-merchant quote. `items` sorted by `amount_out` desc
 * @export
 * @interface OnrampQuotes
 */
export interface OnrampQuotes {
    /**
     * 
     */
    items: Array<OnrampQuoteResult>;
    /**
     * 
     */
    suggested: Array<OnrampQuoteResult>;
    /**
     * 
     */
    unavailableReason?: RampUnavailableReason;
}


/**
 * 
 * @export
 * @interface P2PSessionResult
 */
export interface P2PSessionResult {
    /**
     * 
     */
    deeplinkUrl: string;
    /**
     * 
     */
    dateExpire: string;
}

/**
 * 
 * @export
 */
export const Platform = {
    Android: 'android',
    Ios: 'ios',
    Desktop: 'desktop',
    Web: 'web',
} as const;
export type Platform = typeof Platform[keyof typeof Platform];

/**
 * 
 * @export
 * @interface PrepareCrossSwapRouteRequest
 */
export interface PrepareCrossSwapRouteRequest {
    /**
     * 
     */
    approvalMode?: CrossSwapApprovalMode;
    /**
     * Skip building the transaction on the aggregator side and
     * return a deposit descriptor instead. Send false to get the
     * built transaction back.
     * 
     */
    disableBuildTx?: boolean;
}



/**
 * 
 * @export
 */
export const Provider = {
    Stonfi: 'stonfi',
    Omni: 'omni',
} as const;
export type Provider = typeof Provider[keyof typeof Provider];

/**
 * Fee breakdown in fiat (decimal strings)
 * @export
 * @interface RampFees
 */
export interface RampFees {
    /**
     * 
     */
    provider?: string;
    /**
     * 
     */
    network?: string;
    /**
     * 
     */
    total: string;
}

/**
 * Set when `items` and `suggested` are both empty
 * @export
 */
export const RampUnavailableReason = {
    CountryBlocked: 'country_blocked',
    AmountBelowMin: 'amount_below_min',
    AmountAboveMax: 'amount_above_max',
    NoMerchantSupportsPair: 'no_merchant_supports_pair',
} as const;
export type RampUnavailableReason = typeof RampUnavailableReason[keyof typeof RampUnavailableReason];

/**
 * 
 * @export
 * @interface Readiness503Response
 */
export interface Readiness503Response {
    /**
     * 
     */
    error: string;
}
/**
 * 
 * @export
 * @interface StonFiTrade
 */
export interface StonFiTrade {
    /**
     * 
     */
    fromAsset: string;
    /**
     * 
     */
    toAsset: string;
    /**
     * 
     */
    fromAmount: string;
    /**
     * 
     */
    toAmount: string;
    /**
     * 
     */
    routerAddress: string;
}
/**
 * 
 * @export
 * @interface SubmitCrossSwapPayloadRequest
 */
export interface SubmitCrossSwapPayloadRequest {
    /**
     * Signed payload (base64 or hex, format depends on payload_type)
     */
    signedPayload: string;
    /**
     * 
     */
    broadcastMode: CrossSwapBroadcastMode;
}


/**
 * 
 * @export
 * @interface SwapAsset
 */
export interface SwapAsset {
    /**
     * 
     */
    symbol: string;
    /**
     * 
     */
    name: string;
    /**
     * 
     */
    decimals: number;
    /**
     * 
     */
    address: string;
    /**
     * 
     */
    image: string;
}
/**
 * 
 * @export
 * @interface SwapCalculation
 */
export interface SwapCalculation {
    /**
     * 
     */
    provider: Provider;
    /**
     * 
     */
    trades: Array<Trade>;
}


/**
 * 
 * @export
 * @interface SwapGas
 */
export interface SwapGas {
    /**
     * 
     */
    stonfi: SwapGasStonfi;
    /**
     * 
     */
    omniston: SwapGasStonfi;
}
/**
 * 
 * @export
 * @interface SwapGasStonfi
 */
export interface SwapGasStonfi {
    /**
     * 
     */
    tonToJetton: string;
    /**
     * 
     */
    jettonToTon: string;
    /**
     * 
     */
    jettonToJetton: string;
}
/**
 * 
 * @export
 * @interface TonMessage
 */
export interface TonMessage {
    /**
     * 
     */
    targetAddress: string;
    /**
     * 
     */
    sendAmount: string;
    /**
     * 
     */
    payload: string;
    /**
     * 
     */
    jettonWalletStateInit?: string;
}
/**
 * 
 * @export
 * @interface Trade
 */
export interface Trade {
    /**
     * 
     */
    fromAsset: string;
    /**
     * 
     */
    toAsset: string;
    /**
     * 
     */
    fromAmount: string;
    /**
     * 
     */
    toAmount: string;
    /**
     * 
     */
    blockchainFee: string;
    /**
     * 
     */
    path: Array<string>;
    /**
     * 
     */
    routerAddress?: string;
    /**
     * 
     */
    stonfiRawTrade?: StonFiTrade;
}
