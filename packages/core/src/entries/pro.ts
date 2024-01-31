export interface ProState {
    wallet: ProStateWallet;
    hasCookie: boolean;
    subscription: ProStateSubscription;
}

export interface ProStateWallet {
    publicKey: string;
    rawAddress: string;
}

export interface ProStateSubscription {
    valid: boolean;
    validUntil: number;
}
