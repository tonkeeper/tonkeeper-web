export interface SwapAsset {
    symbol: string;
    name: string;
    decimals: number;
    address: string;
    image: string;
}

export interface SwapConfirmationMessage {
    targetAddress: string; // bounceable address
    sendAmount: string; // raw units (nanotons)
    payload: string; // HEX encoded cell
}

export interface SwapConfirmation {
    messages: SwapConfirmationMessage[];
    quoteId: string;
    resolverName: string;
    askUnits: string; // output amount, raw units
    bidUnits: string; // input amount, raw units
    protocolFeeUnits: string;
    tradeStartDeadline: string; // unix timestamp
    gasBudget: string; // nanotons
    estimatedGasConsumption: string;
    slippage: number; // basis points (50 = 0.5%)
}
