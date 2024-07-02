import { AppKey } from '../Keys';
import { IStorage } from '../Storage';
import {
    defaultWalletsState,
    DeprecatedWalletState,
    isStandardTonWallet,
    WalletId,
    WalletsState,
    WalletState
} from '../entries/wallet';
import { DeprecatedAccountState } from '../entries/account';
import { Network } from '../entries/network';
import { BLOCKCHAIN_NAME } from '../entries/crypto';
import { AuthState, DeprecatedAuthState } from '../entries/password';
import { notNullish } from '../utils/types';

export class WalletsStorage {
    constructor(private storage: IStorage) {}

    getWallets = async () => {
        let state = await this.storage.get<WalletsState>(AppKey.WALLETS);
        if (!state) {
            state = await migrateToWalletState(this.storage);
            if (state) {
                await this.setWallets(state);
            }
        }
        return state ?? defaultWalletsState;
    };

    setWallets = async (state: WalletsState) => {
        await this.storage.set(AppKey.WALLETS, state);
    };

    getActiveWalletId = async () => {
        let state = await this.storage.get<string>(AppKey.ACTIVE_WALLET_ID);
        if (!state) {
            state = await this.migrateToActiveWalletIdState();
            if (state !== null) {
                await this.setActiveWalletId(state);
            }
        }
        return state ?? null;
    };

    getActiveWallet = async (): Promise<WalletState | null> => {
        const id = await this.getActiveWalletId();
        if (id !== null) {
            const state = await this.getWallets();
            return state.find(w => w.id === id) || null;
        }
        return null;
    };

    getWallet = async (id: WalletId): Promise<WalletState | null> => {
        const state = await this.getWallets();
        return state.find(w => w.id === id) || null;
    };

    setActiveWalletId = async (activeWalletId: WalletId | null) => {
        await this.storage.set(AppKey.ACTIVE_WALLET_ID, activeWalletId);
    };

    addWalletToState = async (wallet: WalletState) => {
        await this.addWalletsToState([wallet]);
    };

    addWalletsToState = async (wallets: WalletState[]) => {
        const state = await this.getWallets();
        await this.storage.set(
            AppKey.WALLETS,
            state.concat(wallets.filter(wallet => state.every(w => w.id !== wallet.id)))
        );
    };

    /**
     * Replace found wallets with same id in state and replace them with new ones with no array order changes
     * @param wallets
     */
    updateWalletsInState = async (wallets: WalletState[]) => {
        const state = await this.getWallets();

        for (let i = 0; i < state.length; i++) {
            const wallet = wallets.find(w => w.id === state[i].id);
            if (!wallet) {
                continue;
            }

            state[i] = wallet;
        }

        await this.storage.set(AppKey.WALLETS, state);
    };

    /**
     * Replace found wallet with same id in state and replace it with new one with no array order changes
     * @param wallet
     */
    updateWalletInState = async (wallet: WalletState) => {
        return this.updateWalletsInState([wallet]);
    };

    removeWalletFromState = async (id: WalletId) => {
        const state = await this.getWallets();
        const activeWalletId = await this.getActiveWalletId();

        if (activeWalletId === id) {
            await this.setActiveWalletId(state[0]?.id || null);
        }

        await this.storage.set(
            AppKey.WALLETS,
            state.filter(w => w.id !== id)
        );
    };

    private migrateToActiveWalletIdState = async (): Promise<WalletId | null> => {
        const state = await this.storage.get<DeprecatedAccountState>(AppKey.DEPRECATED_ACCOUNT);
        if (!state || !state.activePublicKey) {
            return null;
        }

        const wallets = await this.getWallets();
        return wallets.find(w => isStandardTonWallet(w) && w.publicKey === state.activePublicKey)!
            .id;
    };
}

export const walletsStorage = (storage: IStorage): WalletsStorage => new WalletsStorage(storage);

async function migrateToWalletState(storage: IStorage): Promise<WalletsState | null> {
    const state = await storage.get<DeprecatedAccountState>(AppKey.DEPRECATED_ACCOUNT);
    if (!state) {
        return null;
    }

    const wallets: (WalletState | null)[] = await Promise.all(
        state.publicKeys.map(async pk => {
            const w = await storage.get<DeprecatedWalletState>(`${AppKey.DEPRECATED_WALLET}_${pk}`);
            if (!w) {
                return null;
            }

            let auth: AuthState;
            let walletAuth = w.auth;
            if (!walletAuth) {
                walletAuth =
                    (await storage.get<DeprecatedAuthState>(AppKey.DEPRECATED_GLOBAL_AUTH_STATE)) ??
                    undefined;
            }

            if (!walletAuth) {
                console.error('Wallet without auth detected', w.active.friendlyAddress);
                return null;
            }

            if (walletAuth.kind === 'none') {
                console.error('NONE AUTH detected for wallet', w.active.friendlyAddress);
                return null;
            }

            if (walletAuth.kind === 'password') {
                const encryptedMnemonic = await storage.get<string>(
                    `${AppKey.DEPRECATED_MNEMONIC}_${pk}`
                );

                if (!encryptedMnemonic) {
                    console.error('Wallet without mnemonic detected', w.active.friendlyAddress);
                    return null;
                }

                auth = {
                    kind: walletAuth.kind,
                    encryptedMnemonic
                };
            } else {
                auth = walletAuth;
            }

            return {
                blockchain: BLOCKCHAIN_NAME.TON,
                name: w.name || 'Wallet ' + w.active.friendlyAddress.slice(-4),
                emoji: w.emoji,
                type: 'standard' as const,
                network: w.network || Network.MAINNET,
                id: w.active.rawAddress,
                version: w.active.version,
                publicKey: w.publicKey,
                rawAddress: w.active.rawAddress,
                auth
            };
        })
    );

    return wallets.filter(notNullish);
}
