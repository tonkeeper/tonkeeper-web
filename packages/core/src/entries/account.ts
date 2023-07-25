export interface AccountState {
    publicKeys: string[];
    activePublicKey?: string;
}

export const defaultAccountState: AccountState = {
    publicKeys: []
};
