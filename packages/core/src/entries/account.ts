/**
 * @deprecated
 */
export interface DeprecatedAccountState {
    publicKeys: string[];
    activePublicKey?: string;
}

export const defaultAccountState: DeprecatedAccountState = {
    publicKeys: []
};
