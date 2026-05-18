/* tslint:disable */
/* eslint-disable */
/**
 * 
 * @export
 * @interface BuildOmnistonSwapRequest
 */
export interface BuildOmnistonSwapRequest {
    /**
     * Source asset address
     * @type {string}
     * @memberof BuildOmnistonSwapRequest
     */
    fromAsset: string;
    /**
     * Target asset address
     * @type {string}
     * @memberof BuildOmnistonSwapRequest
     */
    toAsset: string;
    /**
     * Amount to swap (bid units)
     * @type {string}
     * @memberof BuildOmnistonSwapRequest
     */
    fromAmount?: string;
    /**
     * Amount to receive (ask units)
     * @type {string}
     * @memberof BuildOmnistonSwapRequest
     */
    toAmount?: string;
    /**
     * User wallet address
     * @type {string}
     * @memberof BuildOmnistonSwapRequest
     */
    userAddress: string;
    /**
     * Slippage tolerance in basis points
     * @type {number}
     * @memberof BuildOmnistonSwapRequest
     */
    slippage?: number;
    /**
     * Quote collection TTL in seconds
     * @type {number}
     * @memberof BuildOmnistonSwapRequest
     */
    ttl?: number;
    /**
     * Disable referral fee
     * @type {boolean}
     * @memberof BuildOmnistonSwapRequest
     */
    disableRefFee?: boolean;
    /**
     * Destination address (optional)
     * @type {string}
     * @memberof BuildOmnistonSwapRequest
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
     * 
     * @type {string}
     * @memberof CalculateSwap400Response
     */
    error: string;
}
/**
 * 
 * @export
 * @interface CreateCrossSwapQuoteRequest
 */
export interface CreateCrossSwapQuoteRequest {
    /**
     * Internal chain identifier, format `{chain}/{net}`. Same prefix
     * as the asset_id. Examples: `eth/mainnet`, `btc/mainnet`,
     * `ton/mainnet`, `arb/mainnet`, `op/mainnet`, `polygon/mainnet`,
     * `base/mainnet`, `avax/mainnet`, `tron/mainnet`, `sol/mainnet`,
     * `near/mainnet`.
     * 
     * @type {string}
     * @memberof CreateCrossSwapQuoteRequest
     */
    sourceChainId: string;
    /**
     * Internal asset identifier (same format as onramp asset_id):
     * - native coin: `{chain}/{net}/coin` — e.g. `eth/mainnet/coin`, `btc/mainnet/coin`, `ton/mainnet/coin`
     * - TON jetton: `ton/mainnet/jetton/{raw_address}` — e.g. `ton/mainnet/jetton/0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe`
     * - EVM/Tron/Solana/NEAR token: `{chain}/{net}/token/{address}` — e.g. `eth/mainnet/token/0xdc035d45d973e3ec169d2276ddab16f1e407384f` (USDS)
     * 
     * @type {string}
     * @memberof CreateCrossSwapQuoteRequest
     */
    sourceAsset: string;
    /**
     * Source amount in minimal units
     * @type {string}
     * @memberof CreateCrossSwapQuoteRequest
     */
    sourceAmount: string;
    /**
     * Internal chain identifier (see source_chain_id)
     * @type {string}
     * @memberof CreateCrossSwapQuoteRequest
     */
    destinationChainId: string;
    /**
     * Internal asset identifier (see source_asset)
     * @type {string}
     * @memberof CreateCrossSwapQuoteRequest
     */
    destinationAsset: string;
    /**
     * Address signing the source tx
     * @type {string}
     * @memberof CreateCrossSwapQuoteRequest
     */
    senderAddress: string;
    /**
     * Address receiving funds on the destination chain
     * @type {string}
     * @memberof CreateCrossSwapQuoteRequest
     */
    recipientAddress: string;
    /**
     * 
     * @type {number}
     * @memberof CreateCrossSwapQuoteRequest
     */
    slippageBps?: number;
    /**
     * 
     * @type {CrossSwapExactType}
     * @memberof CreateCrossSwapQuoteRequest
     */
    exactType?: CrossSwapExactType;
    /**
     * Optional whitelist of aggregators to query
     * @type {Array<CrossSwapAggregator>}
     * @memberof CreateCrossSwapQuoteRequest
     */
    aggregators?: Array<CrossSwapAggregator>;
    /**
     * Optional whitelist of underlying protocols
     * @type {Array<CrossSwapProtocol>}
     * @memberof CreateCrossSwapQuoteRequest
     */
    protocols?: Array<CrossSwapProtocol>;
}


/**
 * 
 * @export
 * @interface CreateExchangeRequest
 */
export interface CreateExchangeRequest {
    /**
     * Source currency code
     * @type {string}
     * @memberof CreateExchangeRequest
     */
    from: string;
    /**
     * Target currency code
     * @type {string}
     * @memberof CreateExchangeRequest
     */
    to: string;
    /**
     * Source crypto network
     * @type {string}
     * @memberof CreateExchangeRequest
     */
    fromNetwork?: string;
    /**
     * Target crypto network
     * @type {string}
     * @memberof CreateExchangeRequest
     */
    toNetwork?: string;
    /**
     * User wallet address
     * @type {string}
     * @memberof CreateExchangeRequest
     */
    wallet: string;
    /**
     * Destination Tag / Memo for chains that require it on the destination address (XRP, XLM, EOS, BNB-Beacon, HBAR, etc.).
     * @type {string}
     * @memberof CreateExchangeRequest
     */
    extraId?: string;
    /**
     * 
     * @type {ExchangeFlow}
     * @memberof CreateExchangeRequest
     */
    flow?: ExchangeFlow;
    /**
     * User country code (ISO 3166-1 alpha-2). Deprecated: use device_country_code and store_country_code query parameters instead.
     * @type {string}
     * @memberof CreateExchangeRequest
     * @deprecated
     */
    country?: string;
}


/**
 * 
 * @export
 * @interface CreateP2PSessionRequest
 */
export interface CreateP2PSessionRequest {
    /**
     * Withdrawal wallet address
     * @type {string}
     * @memberof CreateP2PSessionRequest
     */
    wallet: string;
    /**
     * Blockchain chain identifier
     * @type {string}
     * @memberof CreateP2PSessionRequest
     */
    network: string;
    /**
     * Crypto currency code
     * @type {string}
     * @memberof CreateP2PSessionRequest
     */
    cryptoCurrency: string;
    /**
     * Fiat currency code
     * @type {string}
     * @memberof CreateP2PSessionRequest
     */
    fiatCurrency: string;
    /**
     * Optional exchange amount
     * @type {number}
     * @memberof CreateP2PSessionRequest
     */
    amount?: number;
}

/**
 * Cross-chain aggregator that produced the route
 * @export
 */
export const CrossSwapAggregator = {
    Swapkit: 'swapkit',
    Omniston: 'omniston'
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
    Max: 'max'
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
     * @type {string}
     * @memberof CrossSwapAsset
     */
    assetId: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapAsset
     */
    symbol: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapAsset
     */
    name: string;
    /**
     * 
     * @type {number}
     * @memberof CrossSwapAsset
     */
    decimals: number;
    /**
     * URL of the asset's logo, may be empty
     * @type {string}
     * @memberof CrossSwapAsset
     */
    image?: string;
    /**
     * First two segments of asset_id, e.g. `eth/mainnet`
     * @type {string}
     * @memberof CrossSwapAsset
     */
    chainId: string;
    /**
     * 
     * @type {CrossSwapChainFamily}
     * @memberof CrossSwapAsset
     */
    chainFamily: CrossSwapChainFamily;
    /**
     * 
     * @type {boolean}
     * @memberof CrossSwapAsset
     */
    stablecoin?: boolean;
    /**
     * 
     * @type {Array<CrossSwapAggregator>}
     * @memberof CrossSwapAsset
     */
    supportedAggregators: Array<CrossSwapAggregator>;
}


/**
 * 
 * @export
 * @interface CrossSwapAssets
 */
export interface CrossSwapAssets {
    /**
     * 
     * @type {Array<CrossSwapAsset>}
     * @memberof CrossSwapAssets
     */
    assets: Array<CrossSwapAsset>;
}

/**
 * 
 * @export
 */
export const CrossSwapBroadcastMode = {
    Backend: 'backend',
    Client: 'client'
} as const;
export type CrossSwapBroadcastMode = typeof CrossSwapBroadcastMode[keyof typeof CrossSwapBroadcastMode];


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
    Other: 'OTHER'
} as const;
export type CrossSwapChainFamily = typeof CrossSwapChainFamily[keyof typeof CrossSwapChainFamily];


/**
 * Direction of amount specification. Only exact_input is supported in v1.
 * @export
 */
export const CrossSwapExactType = {
    ExactInput: 'exact_input'
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
     * @type {string}
     * @memberof CrossSwapExecution
     */
    executionId: string;
    /**
     * 
     * @type {CrossSwapExecutionStatus}
     * @memberof CrossSwapExecution
     */
    status: CrossSwapExecutionStatus;
    /**
     * 
     * @type {CrossSwapAggregator}
     * @memberof CrossSwapExecution
     */
    aggregator: CrossSwapAggregator;
    /**
     * 
     * @type {CrossSwapProtocol}
     * @memberof CrossSwapExecution
     */
    protocol?: CrossSwapProtocol;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapExecution
     */
    providerTrackingId?: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapExecution
     */
    sourceTxHash?: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapExecution
     */
    destinationTxHash?: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapExecution
     */
    errorCode?: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapExecution
     */
    errorMessage?: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapExecution
     */
    dateUpdate: string;
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
    Unknown: 'unknown'
} as const;
export type CrossSwapExecutionStatus = typeof CrossSwapExecutionStatus[keyof typeof CrossSwapExecutionStatus];

/**
 * 
 * @export
 * @interface CrossSwapFee
 */
export interface CrossSwapFee {
    /**
     * 
     * @type {CrossSwapFeeType}
     * @memberof CrossSwapFee
     */
    type: CrossSwapFeeType;
    /**
     * Asset the fee is denominated in (internal asset id)
     * @type {string}
     * @memberof CrossSwapFee
     */
    asset: string;
    /**
     * Chain on which the fee is paid, format `{chain}/{net}`
     * @type {string}
     * @memberof CrossSwapFee
     */
    chainId?: string;
    /**
     * Fee amount in minimal units
     * @type {string}
     * @memberof CrossSwapFee
     */
    amount: string;
    /**
     * Fee value in USD (decimal string), if known
     * @type {string}
     * @memberof CrossSwapFee
     */
    amountUsd?: string;
}



/**
 * 
 * @export
 */
export const CrossSwapFeeType = {
    Inbound: 'inbound',
    Outbound: 'outbound',
    Network: 'network',
    Liquidity: 'liquidity',
    Affiliate: 'affiliate',
    Service: 'service'
} as const;
export type CrossSwapFeeType = typeof CrossSwapFeeType[keyof typeof CrossSwapFeeType];

/**
 * 
 * @export
 * @interface CrossSwapHumanSummary
 */
export interface CrossSwapHumanSummary {
    /**
     * 
     * @type {string}
     * @memberof CrossSwapHumanSummary
     */
    action: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapHumanSummary
     */
    spendAsset: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapHumanSummary
     */
    spendAmount: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapHumanSummary
     */
    receiveAsset: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapHumanSummary
     */
    receiveAmount?: string;
    /**
     * Final destination of the swap (user's address on destination chain)
     * @type {string}
     * @memberof CrossSwapHumanSummary
     */
    recipientAddress?: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapHumanSummary
     */
    depositAddress?: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapHumanSummary
     */
    memo?: string;
    /**
     * 
     * @type {CrossSwapProtocol}
     * @memberof CrossSwapHumanSummary
     */
    protocol?: CrossSwapProtocol;
    /**
     * For payloads with `kind: approval`, the spender contract being
     * authorised. Backend decodes this from the approve calldata so the
     * wallet can verify before signing.
     * 
     * @type {string}
     * @memberof CrossSwapHumanSummary
     */
    approvalSpender?: string;
    /**
     * For payloads with `kind: approval`, the amount being approved (in
     * minimal units). Backend re-encodes the approve tx to enforce this
     * value — clients can trust it matches the calldata.
     * 
     * @type {string}
     * @memberof CrossSwapHumanSummary
     */
    approvalAmount?: string;
    /**
     * 
     * @type {Array<string>}
     * @memberof CrossSwapHumanSummary
     */
    warnings?: Array<string>;
}


/**
 * Informational description of one hop inside the route. Legs do not require separate user signatures.
 * @export
 * @interface CrossSwapLeg
 */
export interface CrossSwapLeg {
    /**
     * 
     * @type {number}
     * @memberof CrossSwapLeg
     */
    legIndex: number;
    /**
     * 
     * @type {CrossSwapLegType}
     * @memberof CrossSwapLeg
     */
    type: CrossSwapLegType;
    /**
     * Internal chain identifier, format `{chain}/{net}` (e.g. `eth/mainnet`)
     * @type {string}
     * @memberof CrossSwapLeg
     */
    chainId: string;
    /**
     * 
     * @type {CrossSwapChainFamily}
     * @memberof CrossSwapLeg
     */
    chainFamily: CrossSwapChainFamily;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapLeg
     */
    fromAsset?: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapLeg
     */
    toAsset?: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapLeg
     */
    fromAmount?: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapLeg
     */
    estimatedToAmount?: string;
    /**
     * 
     * @type {CrossSwapProtocol}
     * @memberof CrossSwapLeg
     */
    protocol?: CrossSwapProtocol;
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
    Transfer: 'transfer'
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
     * @type {string}
     * @memberof CrossSwapPayload
     */
    payloadId: string;
    /**
     * 
     * @type {CrossSwapPayloadKind}
     * @memberof CrossSwapPayload
     */
    kind: CrossSwapPayloadKind;
    /**
     * Internal chain identifier, format `{chain}/{net}`
     * @type {string}
     * @memberof CrossSwapPayload
     */
    chainId: string;
    /**
     * 
     * @type {CrossSwapChainFamily}
     * @memberof CrossSwapPayload
     */
    chainFamily: CrossSwapChainFamily;
    /**
     * 
     * @type {CrossSwapPayloadType}
     * @memberof CrossSwapPayload
     */
    payloadType: CrossSwapPayloadType;
    /**
     * Base64-encoded payload bytes (PSBT, raw tx, BOC, etc.)
     * @type {string}
     * @memberof CrossSwapPayload
     */
    payload: string;
    /**
     * 
     * @type {CrossSwapHumanSummary}
     * @memberof CrossSwapPayload
     */
    humanSummary: CrossSwapHumanSummary;
    /**
     * 
     * @type {CrossSwapValidationStatus}
     * @memberof CrossSwapPayload
     */
    validationStatus: CrossSwapValidationStatus;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapPayload
     */
    dateExpire: string;
}



/**
 * 
 * @export
 */
export const CrossSwapPayloadKind = {
    Main: 'main',
    Approval: 'approval'
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
    RippleTx: 'ripple_tx'
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
     * @type {string}
     * @memberof CrossSwapPrepare
     */
    routeId: string;
    /**
     * 
     * @type {Array<CrossSwapPayload>}
     * @memberof CrossSwapPrepare
     */
    payloads: Array<CrossSwapPayload>;
}

/**
 * Underlying protocol or DEX that actually executes the swap
 * @export
 */
export const CrossSwapProtocol = {
    Thorchain: 'thorchain',
    ThorchainStreaming: 'thorchain_streaming',
    Mayachain: 'mayachain',
    MayachainStreaming: 'mayachain_streaming',
    Chainflip: 'chainflip',
    ChainflipStreaming: 'chainflip_streaming',
    NearIntents: 'near_intents',
    Garden: 'garden',
    Flashnet: 'flashnet',
    Harbor: 'harbor',
    Cake: 'cake',
    _1inch: '1inch',
    Jupiter: 'jupiter',
    UniswapV3: 'uniswap_v3',
    Pancakeswap: 'pancakeswap',
    Omniston: 'omniston',
    Stonfi: 'stonfi',
    DexOther: 'dex_other'
} as const;
export type CrossSwapProtocol = typeof CrossSwapProtocol[keyof typeof CrossSwapProtocol];

/**
 * Per-aggregator error explaining why a quote returned no route
 * @export
 * @interface CrossSwapProviderError
 */
export interface CrossSwapProviderError {
    /**
     * 
     * @type {CrossSwapAggregator}
     * @memberof CrossSwapProviderError
     */
    aggregator: CrossSwapAggregator;
    /**
     * 
     * @type {CrossSwapProtocol}
     * @memberof CrossSwapProviderError
     */
    protocol?: CrossSwapProtocol;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapProviderError
     */
    code: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapProviderError
     */
    message: string;
}


/**
 * 
 * @export
 * @interface CrossSwapQuote
 */
export interface CrossSwapQuote {
    /**
     * Identifier of this quote, used for telemetry and prepare correlation
     * @type {string}
     * @memberof CrossSwapQuote
     */
    quoteId: string;
    /**
     * 
     * @type {Array<CrossSwapRoute>}
     * @memberof CrossSwapQuote
     */
    routes: Array<CrossSwapRoute>;
    /**
     * Errors returned by aggregators that yielded no usable route
     * @type {Array<CrossSwapProviderError>}
     * @memberof CrossSwapQuote
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
    High: 'high'
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
     * @type {string}
     * @memberof CrossSwapRoute
     */
    routeId: string;
    /**
     * 
     * @type {CrossSwapAggregator}
     * @memberof CrossSwapRoute
     */
    aggregator: CrossSwapAggregator;
    /**
     * 
     * @type {CrossSwapProtocol}
     * @memberof CrossSwapRoute
     */
    protocol: CrossSwapProtocol;
    /**
     * 
     * @type {CrossSwapRouteType}
     * @memberof CrossSwapRoute
     */
    routeType: CrossSwapRouteType;
    /**
     * Raw base-units amount the user is paying (echoed back from the quote request).
     * @type {string}
     * @memberof CrossSwapRoute
     */
    sourceAmount?: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapRoute
     */
    estimatedDestinationAmount: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapRoute
     */
    minimumDestinationAmount: string;
    /**
     * 
     * @type {CrossSwapTimeEstimate}
     * @memberof CrossSwapRoute
     */
    estimatedTime?: CrossSwapTimeEstimate;
    /**
     * Aggregate slippage across all legs (bps)
     * @type {number}
     * @memberof CrossSwapRoute
     */
    totalSlippageBps?: number;
    /**
     * USD value difference between input and output, in basis points
     * (1% = 100 bps, so -300 = -3%). Negative means the user receives
     * less USD than they pay. Omitted when |bps| < 300 or USD prices
     * are unavailable.
     * 
     * @type {number}
     * @memberof CrossSwapRoute
     */
    valueDifferenceBps?: number;
    /**
     * USD price of one whole source-asset unit at quote time. Omitted when unknown.
     * @type {number}
     * @memberof CrossSwapRoute
     */
    sourceUsdPrice?: number;
    /**
     * USD price of one whole destination-asset unit at quote time. Omitted when unknown.
     * @type {number}
     * @memberof CrossSwapRoute
     */
    destinationUsdPrice?: number;
    /**
     * Aggregator-assigned highlights (e.g. fastest, cheapest)
     * @type {Array<CrossSwapRouteTag>}
     * @memberof CrossSwapRoute
     */
    tags?: Array<CrossSwapRouteTag>;
    /**
     * 
     * @type {Array<string>}
     * @memberof CrossSwapRoute
     */
    warnings?: Array<string>;
    /**
     * 
     * @type {Array<CrossSwapFee>}
     * @memberof CrossSwapRoute
     */
    fees?: Array<CrossSwapFee>;
    /**
     * 
     * @type {Array<CrossSwapLeg>}
     * @memberof CrossSwapRoute
     */
    legs: Array<CrossSwapLeg>;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapRoute
     */
    dateExpire: string;
    /**
     * 
     * @type {CrossSwapRiskLevel}
     * @memberof CrossSwapRoute
     */
    riskLevel: CrossSwapRiskLevel;
}



/**
 * 
 * @export
 */
export const CrossSwapRouteTag = {
    Fastest: 'fastest',
    Recommended: 'recommended',
    Cheapest: 'cheapest'
} as const;
export type CrossSwapRouteTag = typeof CrossSwapRouteTag[keyof typeof CrossSwapRouteTag];


/**
 * 
 * @export
 */
export const CrossSwapRouteType = {
    CrossChainSwap: 'cross_chain_swap',
    SameChainSwap: 'same_chain_swap',
    Bridge: 'bridge'
} as const;
export type CrossSwapRouteType = typeof CrossSwapRouteType[keyof typeof CrossSwapRouteType];

/**
 * 
 * @export
 * @interface CrossSwapSubmit
 */
export interface CrossSwapSubmit {
    /**
     * 
     * @type {string}
     * @memberof CrossSwapSubmit
     */
    executionId: string;
    /**
     * 
     * @type {string}
     * @memberof CrossSwapSubmit
     */
    sourceTxHash?: string;
    /**
     * 
     * @type {CrossSwapExecutionStatus}
     * @memberof CrossSwapSubmit
     */
    status: CrossSwapExecutionStatus;
}


/**
 * Per-stage time estimate breakdown. Stages may be 0 when not applicable (e.g. no inbound confirmation needed).
 * @export
 * @interface CrossSwapTimeEstimate
 */
export interface CrossSwapTimeEstimate {
    /**
     * Time to confirm the source-chain tx
     * @type {number}
     * @memberof CrossSwapTimeEstimate
     */
    inboundSeconds?: number;
    /**
     * Time spent inside the swap protocol
     * @type {number}
     * @memberof CrossSwapTimeEstimate
     */
    swapSeconds?: number;
    /**
     * Time to confirm the destination-chain tx
     * @type {number}
     * @memberof CrossSwapTimeEstimate
     */
    outboundSeconds?: number;
    /**
     * 
     * @type {number}
     * @memberof CrossSwapTimeEstimate
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
    Rejected: 'rejected'
} as const;
export type CrossSwapValidationStatus = typeof CrossSwapValidationStatus[keyof typeof CrossSwapValidationStatus];

/**
 * 
 * @export
 * @interface ExchangeAsset
 */
export interface ExchangeAsset {
    /**
     * 
     * @type {string}
     * @memberof ExchangeAsset
     */
    slug: string;
    /**
     * 
     * @type {ExchangeAssetType}
     * @memberof ExchangeAsset
     */
    type: ExchangeAssetType;
    /**
     * 
     * @type {Array<ExchangeMethod>}
     * @memberof ExchangeAsset
     */
    inputMethods: Array<ExchangeMethod>;
    /**
     * 
     * @type {Array<ExchangeMethod>}
     * @memberof ExchangeAsset
     */
    outputMethods: Array<ExchangeMethod>;
    /**
     * 
     * @type {string}
     * @memberof ExchangeAsset
     */
    image?: string;
    /**
     * 
     * @type {number}
     * @memberof ExchangeAsset
     */
    decimals?: number;
    /**
     * 
     * @type {boolean}
     * @memberof ExchangeAsset
     */
    stablecoin?: boolean;
}



/**
 * 
 * @export
 */
export const ExchangeAssetType = {
    Fiat: 'fiat',
    Crypto: 'crypto'
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
     * @type {ExchangeMerchantSlug}
     * @memberof ExchangeAvailablePair
     */
    merchant: ExchangeMerchantSlug;
    /**
     * 
     * @type {ExchangeDirection}
     * @memberof ExchangeAvailablePair
     */
    direction: ExchangeDirection;
    /**
     * 
     * @type {string}
     * @memberof ExchangeAvailablePair
     */
    cryptoCurrency: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeAvailablePair
     */
    cryptoNetwork: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeAvailablePair
     */
    fiatCurrency: string;
    /**
     * 
     * @type {ExchangeLimits}
     * @memberof ExchangeAvailablePair
     */
    limits?: ExchangeLimits;
    /**
     * 
     * @type {Array<ExchangePaymentMethodType>}
     * @memberof ExchangeAvailablePair
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
     * @type {string}
     * @memberof ExchangeCalculateRequest
     */
    from: string;
    /**
     * Target currency code
     * @type {string}
     * @memberof ExchangeCalculateRequest
     */
    to: string;
    /**
     * Crypto network. Deprecated: use from_network and to_network instead.
     * @type {string}
     * @memberof ExchangeCalculateRequest
     * @deprecated
     */
    network?: string;
    /**
     * Source crypto network (required for sell and swap)
     * @type {string}
     * @memberof ExchangeCalculateRequest
     */
    fromNetwork?: string;
    /**
     * Target crypto network (required for buy and swap)
     * @type {string}
     * @memberof ExchangeCalculateRequest
     */
    toNetwork?: string;
    /**
     * Amount to exchange
     * @type {string}
     * @memberof ExchangeCalculateRequest
     */
    amount: string;
    /**
     * User wallet address
     * @type {string}
     * @memberof ExchangeCalculateRequest
     */
    wallet: string;
    /**
     * 
     * @type {ExchangeDirection}
     * @memberof ExchangeCalculateRequest
     */
    purchaseType: ExchangeDirection;
    /**
     * User country code (ISO 3166-1 alpha-2). Deprecated: use device_country_code and store_country_code query parameters instead.
     * @type {string}
     * @memberof ExchangeCalculateRequest
     * @deprecated
     */
    country?: string;
    /**
     * 
     * @type {ExchangePaymentMethodType}
     * @memberof ExchangeCalculateRequest
     */
    paymentMethod?: ExchangePaymentMethodType;
    /**
     * When true, amount is interpreted as target crypto amount instead of source amount
     * @type {boolean}
     * @memberof ExchangeCalculateRequest
     */
    reverse?: boolean;
    /**
     * 
     * @type {ExchangeFlow}
     * @memberof ExchangeCalculateRequest
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
     * @type {Array<ExchangeQuote>}
     * @memberof ExchangeCalculation
     */
    items: Array<ExchangeQuote>;
    /**
     * 
     * @type {Array<ExchangeQuote>}
     * @memberof ExchangeCalculation
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
     * @type {Array<ExchangeAsset>}
     * @memberof ExchangeCurrencies
     */
    assets: Array<ExchangeAsset>;
    /**
     * 
     * @type {Array<ExchangeMerchant>}
     * @memberof ExchangeCurrencies
     */
    merchants: Array<ExchangeMerchant>;
    /**
     * 
     * @type {Array<ExchangePair>}
     * @memberof ExchangeCurrencies
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
     * @type {string}
     * @memberof ExchangeCurrencyInfo
     */
    symbol: string;
    /**
     * Blockchain network (e.g. native, jetton, erc-20)
     * @type {string}
     * @memberof ExchangeCurrencyInfo
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
    Swap: 'swap'
} as const;
export type ExchangeDirection = typeof ExchangeDirection[keyof typeof ExchangeDirection];


/**
 * 
 * @export
 */
export const ExchangeFlow = {
    Deposit: 'deposit',
    Withdraw: 'withdraw'
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
     * @type {Array<ExchangeLayoutItem>}
     * @memberof ExchangeLayout
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
     * @type {string}
     * @memberof ExchangeLayoutAsset
     */
    symbol: string;
    /**
     * Internal asset identifier (e.g. `ton/mainnet/coin`, `eth/mainnet/token/0xdc03...`, `ton/mainnet/jetton/0:b113...`)
     * @type {string}
     * @memberof ExchangeLayoutAsset
     */
    assetId: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutAsset
     */
    network: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutAsset
     */
    networkName: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutAsset
     */
    networkImage: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutAsset
     */
    image: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutAsset
     */
    address?: string;
    /**
     * 
     * @type {number}
     * @memberof ExchangeLayoutAsset
     */
    decimals: number;
    /**
     * 
     * @type {boolean}
     * @memberof ExchangeLayoutAsset
     */
    stablecoin: boolean;
    /**
     * 
     * @type {Array<ExchangeLayoutCashMethod>}
     * @memberof ExchangeLayoutAsset
     */
    cashMethods: Array<ExchangeLayoutCashMethod>;
    /**
     * 
     * @type {Array<ExchangeLayoutCryptoMethod>}
     * @memberof ExchangeLayoutAsset
     */
    cryptoMethods: Array<ExchangeLayoutCryptoMethod>;
}
/**
 * 
 * @export
 * @interface ExchangeLayoutCashMethod
 */
export interface ExchangeLayoutCashMethod {
    /**
     * 
     * @type {ExchangePaymentMethodType}
     * @memberof ExchangeLayoutCashMethod
     */
    type: ExchangePaymentMethodType;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutCashMethod
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutCashMethod
     */
    image: string;
    /**
     * 
     * @type {Array<ExchangeLayoutProvider>}
     * @memberof ExchangeLayoutCashMethod
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
     * @type {string}
     * @memberof ExchangeLayoutCryptoMethod
     */
    symbol: string;
    /**
     * Internal asset identifier (e.g. `ton/mainnet/coin`, `eth/mainnet/token/0xdc03...`, `ton/mainnet/jetton/0:b113...`)
     * @type {string}
     * @memberof ExchangeLayoutCryptoMethod
     */
    assetId: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutCryptoMethod
     */
    network: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutCryptoMethod
     */
    networkName: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutCryptoMethod
     */
    networkImage: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutCryptoMethod
     */
    image: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutCryptoMethod
     */
    address?: string;
    /**
     * 
     * @type {number}
     * @memberof ExchangeLayoutCryptoMethod
     */
    decimals: number;
    /**
     * 
     * @type {boolean}
     * @memberof ExchangeLayoutCryptoMethod
     */
    stablecoin: boolean;
    /**
     * Withdrawal fee in USD (for stablecoins)
     * @type {number}
     * @memberof ExchangeLayoutCryptoMethod
     */
    fee?: number;
    /**
     * Minimum withdrawal amount in USD (for stablecoins)
     * @type {number}
     * @memberof ExchangeLayoutCryptoMethod
     */
    minAmount?: number;
    /**
     * 
     * @type {Array<ExchangeLayoutProvider>}
     * @memberof ExchangeLayoutCryptoMethod
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
     * @type {ExchangeLayoutItemType}
     * @memberof ExchangeLayoutItem
     */
    type: ExchangeLayoutItemType;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutItem
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutItem
     */
    description: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutItem
     */
    image: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeLayoutItem
     */
    preferredCurrency?: string;
    /**
     * 
     * @type {Array<ExchangeLayoutAsset>}
     * @memberof ExchangeLayoutItem
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
    Stablecoin: 'stablecoin'
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
     * @type {ExchangeMerchantSlug}
     * @memberof ExchangeLayoutProvider
     */
    slug: ExchangeMerchantSlug;
    /**
     * 
     * @type {ExchangeLimits}
     * @memberof ExchangeLayoutProvider
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
     * @type {number}
     * @memberof ExchangeLimits
     */
    min?: number;
    /**
     * 
     * @type {number}
     * @memberof ExchangeLimits
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
     * @type {string}
     * @memberof ExchangeMerchant
     */
    name: string;
    /**
     * 
     * @type {ExchangeMerchantSlug}
     * @memberof ExchangeMerchant
     */
    slug: ExchangeMerchantSlug;
    /**
     * 
     * @type {Array<string>}
     * @memberof ExchangeMerchant
     */
    inputMethods: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof ExchangeMerchant
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
     * @type {string}
     * @memberof ExchangeMerchantInfo
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeMerchantInfo
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeMerchantInfo
     */
    description: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeMerchantInfo
     */
    image: string;
    /**
     * 
     * @type {number}
     * @memberof ExchangeMerchantInfo
     */
    fee: number;
    /**
     * 
     * @type {Array<ExchangeMerchantInfoButton>}
     * @memberof ExchangeMerchantInfo
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
     * @type {string}
     * @memberof ExchangeMerchantInfoButton
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeMerchantInfoButton
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
    Wallet: 'wallet'
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
     * @type {string}
     * @memberof ExchangeMethod
     */
    type: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeMethod
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
     * @type {ExchangeCurrencyInfo}
     * @memberof ExchangePair
     */
    from: ExchangeCurrencyInfo;
    /**
     * 
     * @type {ExchangeCurrencyInfo}
     * @memberof ExchangePair
     */
    to: ExchangeCurrencyInfo;
    /**
     * 
     * @type {Array<ExchangeSimpleMerchant>}
     * @memberof ExchangePair
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
     * @type {number}
     * @memberof ExchangePairs
     */
    count: number;
    /**
     * 
     * @type {Array<ExchangeAvailablePair>}
     * @memberof ExchangePairs
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
     * @type {ExchangeMerchantSlug}
     * @memberof ExchangePaymentMethod
     */
    merchant: ExchangeMerchantSlug;
    /**
     * 
     * @type {Array<ExchangePaymentMethodMethodsInner>}
     * @memberof ExchangePaymentMethod
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
     * @type {ExchangePaymentMethodType}
     * @memberof ExchangePaymentMethodMethodsInner
     */
    type: ExchangePaymentMethodType;
    /**
     * 
     * @type {string}
     * @memberof ExchangePaymentMethodMethodsInner
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
    P2p: 'p2p'
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
     * @type {ExchangeMerchantSlug}
     * @memberof ExchangeQuote
     */
    merchant: ExchangeMerchantSlug;
    /**
     * 
     * @type {number}
     * @memberof ExchangeQuote
     */
    amount: number;
    /**
     * Source amount the user needs to pay (present when reverse=true)
     * @type {number}
     * @memberof ExchangeQuote
     */
    fromAmount?: number;
    /**
     * 
     * @type {string}
     * @memberof ExchangeQuote
     */
    widgetUrl?: string;
    /**
     * 
     * @type {number}
     * @memberof ExchangeQuote
     */
    minAmount?: number;
    /**
     * 
     * @type {number}
     * @memberof ExchangeQuote
     */
    maxAmount?: number;
    /**
     * 
     * @type {string}
     * @memberof ExchangeQuote
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
     * @type {string}
     * @memberof ExchangeResult
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof ExchangeResult
     */
    payinAddress: string;
    /**
     * Memo / Destination Tag the user must include with the deposit transfer (when required by the source chain).
     * @type {string}
     * @memberof ExchangeResult
     */
    payinExtraId?: string;
    /**
     * Human-readable name of the extra id required at the destination (e.g. "Destination Tag", "Memo"). Empty when not required.
     * @type {string}
     * @memberof ExchangeResult
     */
    extraIdName?: string;
    /**
     * 
     * @type {number}
     * @memberof ExchangeResult
     */
    amountExpectedFrom: number;
    /**
     * 
     * @type {number}
     * @memberof ExchangeResult
     */
    amountExpectedTo: number;
    /**
     * 
     * @type {string}
     * @memberof ExchangeResult
     */
    status: string;
    /**
     * 
     * @type {number}
     * @memberof ExchangeResult
     */
    minDeposit: number;
    /**
     * 
     * @type {number}
     * @memberof ExchangeResult
     */
    maxDeposit: number;
    /**
     * 
     * @type {number}
     * @memberof ExchangeResult
     */
    rate: number;
    /**
     * Estimated exchange duration in seconds
     * @type {number}
     * @memberof ExchangeResult
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
     * @type {ExchangeMerchantSlug}
     * @memberof ExchangeSimpleMerchant
     */
    slug: ExchangeMerchantSlug;
    /**
     * 
     * @type {ExchangeLimits}
     * @memberof ExchangeSimpleMerchant
     */
    limits?: ExchangeLimits;
}


/**
 * 
 * @export
 * @interface OmnistonSwapMessages
 */
export interface OmnistonSwapMessages {
    /**
     * 
     * @type {Array<TonMessage>}
     * @memberof OmnistonSwapMessages
     */
    messages: Array<TonMessage>;
    /**
     * 
     * @type {string}
     * @memberof OmnistonSwapMessages
     */
    quoteId: string;
    /**
     * 
     * @type {string}
     * @memberof OmnistonSwapMessages
     */
    resolverName: string;
    /**
     * 
     * @type {string}
     * @memberof OmnistonSwapMessages
     */
    askUnits: string;
    /**
     * Amount of bid asset the trader must pay, including all fees
     * @type {string}
     * @memberof OmnistonSwapMessages
     */
    bidUnits: string;
    /**
     * Amount of fees charged by the protocol
     * @type {string}
     * @memberof OmnistonSwapMessages
     */
    protocolFeeUnits: string;
    /**
     * Max timestamp (UTC seconds) for trade start
     * @type {string}
     * @memberof OmnistonSwapMessages
     */
    tradeStartDeadline: string;
    /**
     * Total gas budget required
     * @type {string}
     * @memberof OmnistonSwapMessages
     */
    gasBudget: string;
    /**
     * Estimated gas units to be spent
     * @type {string}
     * @memberof OmnistonSwapMessages
     */
    estimatedGasConsumption: string;
    /**
     * 
     * @type {number}
     * @memberof OmnistonSwapMessages
     */
    slippage: number;
    /**
     * USD value difference between input and output, in basis points
     * (1% = 100 bps, so -300 = -3%). Negative means the user receives
     * less USD than they pay. Omitted when |bps| < 300 or USD prices
     * are unavailable.
     * 
     * @type {number}
     * @memberof OmnistonSwapMessages
     */
    valueDifferenceBps?: number;
}
/**
 * 
 * @export
 * @interface P2PSessionResult
 */
export interface P2PSessionResult {
    /**
     * 
     * @type {string}
     * @memberof P2PSessionResult
     */
    deeplinkUrl: string;
    /**
     * 
     * @type {string}
     * @memberof P2PSessionResult
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
    Desktop: 'desktop'
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
     * @type {CrossSwapApprovalMode}
     * @memberof PrepareCrossSwapRouteRequest
     */
    approvalMode?: CrossSwapApprovalMode;
}



/**
 * 
 * @export
 */
export const Provider = {
    Stonfi: 'stonfi',
    Omni: 'omni'
} as const;
export type Provider = typeof Provider[keyof typeof Provider];

/**
 * 
 * @export
 * @interface StonFiTrade
 */
export interface StonFiTrade {
    /**
     * 
     * @type {string}
     * @memberof StonFiTrade
     */
    fromAsset: string;
    /**
     * 
     * @type {string}
     * @memberof StonFiTrade
     */
    toAsset: string;
    /**
     * 
     * @type {string}
     * @memberof StonFiTrade
     */
    fromAmount: string;
    /**
     * 
     * @type {string}
     * @memberof StonFiTrade
     */
    toAmount: string;
    /**
     * 
     * @type {string}
     * @memberof StonFiTrade
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
     * @type {string}
     * @memberof SubmitCrossSwapPayloadRequest
     */
    signedPayload: string;
    /**
     * 
     * @type {CrossSwapBroadcastMode}
     * @memberof SubmitCrossSwapPayloadRequest
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
     * @type {string}
     * @memberof SwapAsset
     */
    symbol: string;
    /**
     * 
     * @type {string}
     * @memberof SwapAsset
     */
    name: string;
    /**
     * 
     * @type {number}
     * @memberof SwapAsset
     */
    decimals: number;
    /**
     * 
     * @type {string}
     * @memberof SwapAsset
     */
    address: string;
    /**
     * 
     * @type {string}
     * @memberof SwapAsset
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
     * @type {Provider}
     * @memberof SwapCalculation
     */
    provider: Provider;
    /**
     * 
     * @type {Array<Trade>}
     * @memberof SwapCalculation
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
     * @type {SwapGasStonfi}
     * @memberof SwapGas
     */
    stonfi: SwapGasStonfi;
    /**
     * 
     * @type {SwapGasStonfi}
     * @memberof SwapGas
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
     * @type {string}
     * @memberof SwapGasStonfi
     */
    tonToJetton: string;
    /**
     * 
     * @type {string}
     * @memberof SwapGasStonfi
     */
    jettonToTon: string;
    /**
     * 
     * @type {string}
     * @memberof SwapGasStonfi
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
     * @type {string}
     * @memberof TonMessage
     */
    targetAddress: string;
    /**
     * 
     * @type {string}
     * @memberof TonMessage
     */
    sendAmount: string;
    /**
     * 
     * @type {string}
     * @memberof TonMessage
     */
    payload: string;
    /**
     * 
     * @type {string}
     * @memberof TonMessage
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
     * @type {string}
     * @memberof Trade
     */
    fromAsset: string;
    /**
     * 
     * @type {string}
     * @memberof Trade
     */
    toAsset: string;
    /**
     * 
     * @type {string}
     * @memberof Trade
     */
    fromAmount: string;
    /**
     * 
     * @type {string}
     * @memberof Trade
     */
    toAmount: string;
    /**
     * 
     * @type {string}
     * @memberof Trade
     */
    blockchainFee: string;
    /**
     * 
     * @type {Array<string>}
     * @memberof Trade
     */
    path: Array<string>;
    /**
     * 
     * @type {string}
     * @memberof Trade
     */
    routerAddress?: string;
    /**
     * 
     * @type {StonFiTrade}
     * @memberof Trade
     */
    stonfiRawTrade?: StonFiTrade;
}
