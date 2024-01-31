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

export interface ProPlan {
    id: string;
    name: string;
    description?: string;
    price: string; // nano ton
}
