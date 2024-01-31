export interface ProState {
    wallet: {
        publicKey: string;
        rawAddress: string;
    };
    valid: boolean;
    validUntil: number;
}
