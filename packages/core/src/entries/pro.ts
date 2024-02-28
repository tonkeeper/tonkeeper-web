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
    is_trial: boolean;
    used_trial: boolean;
    next_charge?: number | undefined;
}
