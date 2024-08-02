// eslint-disable-next-line max-classes-per-file
import { KeystonePathInfo } from '../service/keystone/types';
import { AuthKeychain, AuthPassword, AuthSigner, AuthSignerDeepLink } from './password';
import { DerivationItem, TonWalletStandard, WalletId } from './wallet';

/**
 * @deprecated
 */
export interface DeprecatedAccountState {
    publicKeys: string[];
    activePublicKey?: string;
}

export type AccountId = string;

export interface IAccount {
    id: AccountId;
    name: string;
    emoji: string;

    get allTonWallets(): TonWalletStandard[];
    get activeDerivationTonWallets(): TonWalletStandard[];
    get activeTonWallet(): TonWalletStandard;

    getTonWallet(id: WalletId): TonWalletStandard | undefined;
    updateTonWallet(wallet: TonWalletStandard): void;
    addTonWalletToActiveDerivation(wallet: TonWalletStandard): void;
    removeTonWalletFromActiveDerivation(walletId: WalletId): void;
    setActiveTonWallet(walletId: WalletId): void;
}

export abstract class Clonable {
    clone() {
        const cloned = structuredClone(this);
        Object.setPrototypeOf(cloned, Object.getPrototypeOf(this));
        return cloned as this;
    }
}

export abstract class FallbackEmoji extends Clonable {
    constructor(public emoji: string) {
        super();
        if (!this.emoji) {
            this.emoji = '😀';
        }
    }
}

export class AccountTonMnemonic extends FallbackEmoji implements IAccount {
    public readonly type = 'mnemonic';

    get allTonWallets() {
        return this.tonWallets;
    }

    get activeDerivationTonWallets() {
        return this.tonWallets;
    }

    get activeTonWallet() {
        return this.tonWallets.find(w => w.id === this.activeTonWalletId)!;
    }

    /**
     *  @param id ton public key hex string without 0x corresponding to the mnemonic
     */
    constructor(
        public readonly id: AccountId,
        public name: string,
        public emoji: string,
        public auth: AuthPassword | AuthKeychain,
        public activeTonWalletId: WalletId,
        public tonWallets: TonWalletStandard[]
    ) {
        super(emoji);
    }

    getTonWallet(id: WalletId) {
        return this.allTonWallets.find(w => w.id === id);
    }

    updateTonWallet(wallet: TonWalletStandard) {
        const index = this.tonWallets.findIndex(w => w.id === wallet.id)!;
        if (index === -1) {
            throw new Error('Wallet not found');
        }
        this.tonWallets[index] = wallet;
    }

    addTonWalletToActiveDerivation(wallet: TonWalletStandard) {
        const walletExists = this.tonWallets.findIndex(w => w.id === wallet.id);
        if (walletExists === -1) {
            this.tonWallets = this.tonWallets.concat(wallet);
        } else {
            this.tonWallets[walletExists] = wallet;
        }
    }

    removeTonWalletFromActiveDerivation(walletId: WalletId) {
        if (this.tonWallets.length === 1) {
            throw new Error('Cannot remove last wallet');
        }

        this.tonWallets = this.tonWallets.filter(w => w.id !== walletId);
        if (this.activeTonWalletId === walletId) {
            this.activeTonWalletId = this.tonWallets[0].id;
        }
    }

    setActiveTonWallet(walletId: WalletId) {
        if (this.tonWallets.every(w => w.id !== walletId)) {
            throw new Error('Wallet not found');
        }
        this.activeTonWalletId = walletId;
    }
}

export class AccountLedger extends FallbackEmoji implements IAccount {
    public readonly type = 'ledger';

    get allTonWallets() {
        return this.derivations.flatMap(d => d.tonWallets);
    }

    get activeDerivationTonWallets() {
        return this.activeDerivation.tonWallets;
    }

    get activeDerivation() {
        return this.derivations.find(d => this.activeDerivationIndex === d.index)!;
    }

    get activeTonWallet() {
        const activeDerivation = this.activeDerivation;
        return this.activeDerivationTonWallets.find(
            w => w.id === activeDerivation.activeTonWalletId
        )!;
    }

    get derivations(): DerivationItem[] {
        return this.addedDerivationsIndexes.map(
            index => this.allAvailableDerivations.find(d => d.index === index)!
        );
    }

    /**
     *  @param id index 0 derivation ton public key hex string without 0x
     */
    constructor(
        public readonly id: AccountId,
        public name: string,
        public emoji: string,
        public activeDerivationIndex: number,
        public addedDerivationsIndexes: number[],
        public readonly allAvailableDerivations: DerivationItem[]
    ) {
        super(emoji);

        if (
            addedDerivationsIndexes.some(index =>
                allAvailableDerivations.every(d => d.index !== index)
            )
        ) {
            throw new Error('Derivations not found');
        }

        if (!addedDerivationsIndexes.includes(activeDerivationIndex)) {
            throw new Error('Active derivation not found');
        }

        this.addedDerivationsIndexes = [...new Set(addedDerivationsIndexes)];
    }

    getTonWallet(id: WalletId) {
        return this.allTonWallets.find(w => w.id === id);
    }

    updateTonWallet(wallet: TonWalletStandard) {
        for (const derivation of this.derivations) {
            const index = derivation.tonWallets.findIndex(w => w.id === wallet.id);
            if (index !== -1) {
                derivation.tonWallets[index] = wallet;
                return;
            }
        }

        throw new Error('Derivation not found');
    }

    addTonWalletToActiveDerivation(wallet: TonWalletStandard) {
        const walletExists = this.activeDerivation.tonWallets.findIndex(w => w.id === wallet.id);
        if (walletExists === -1) {
            this.activeDerivation.tonWallets = this.activeDerivation.tonWallets.concat(wallet);
        } else {
            this.activeDerivation.tonWallets[walletExists] = wallet;
        }
    }

    removeTonWalletFromActiveDerivation(walletId: WalletId) {
        if (this.activeDerivation.tonWallets.length === 1) {
            throw new Error('Cannot remove last wallet');
        }

        this.activeDerivation.tonWallets = this.activeDerivation.tonWallets.filter(
            w => w.id !== walletId
        );
        if (this.activeDerivation.activeTonWalletId === walletId) {
            this.activeDerivation.activeTonWalletId = this.activeDerivation.tonWallets[0].id;
        }
    }

    setActiveTonWallet(walletId: WalletId) {
        for (const derivation of this.derivations) {
            const walletInDerivation = derivation.tonWallets.some(w => w.id === walletId);
            if (walletInDerivation) {
                derivation.activeTonWalletId = walletId;
                this.activeDerivationIndex = derivation.index;
                return;
            }
        }

        throw new Error('Derivation not found');
    }

    setActiveDerivationIndex(index: number) {
        if (!this.addedDerivationsIndexes.includes(index)) {
            throw new Error('Derivation not found');
        }

        this.activeDerivationIndex = index;
    }

    setAddedDerivationsIndexes(addedDerivationsIndexes: number[]) {
        if (addedDerivationsIndexes.length === 0) {
            throw new Error('Cant set empty derivations');
        }
        if (
            addedDerivationsIndexes.some(index =>
                this.allAvailableDerivations.every(d => d.index !== index)
            )
        ) {
            throw new Error('Derivations not found');
        }
        this.addedDerivationsIndexes = [...new Set(addedDerivationsIndexes)];
        if (!this.addedDerivationsIndexes.includes(this.activeDerivationIndex)) {
            this.activeDerivationIndex = this.addedDerivationsIndexes[0];
        }
    }
}

export class AccountKeystone extends FallbackEmoji implements IAccount {
    public readonly type = 'keystone';

    get allTonWallets() {
        return [this.tonWallet];
    }

    get activeDerivationTonWallets() {
        return [this.tonWallet];
    }

    get activeTonWallet() {
        return this.tonWallet;
    }

    /**
     *  @param id ton public key hex string without 0x
     */
    constructor(
        public readonly id: AccountId,
        public name: string,
        public emoji: string,
        public readonly pathInfo: KeystonePathInfo | undefined,
        public tonWallet: TonWalletStandard
    ) {
        super(emoji);
    }

    getTonWallet(id: WalletId) {
        return this.allTonWallets.find(w => w.id === id);
    }

    updateTonWallet(wallet: TonWalletStandard) {
        this.tonWallet = wallet;
    }

    addTonWalletToActiveDerivation() {
        throw new Error('Cannot add ton wallet to keystone account');
    }

    removeTonWalletFromActiveDerivation() {
        throw new Error('Cannot remove ton wallet from keystone account');
    }

    setActiveTonWallet(walletId: WalletId) {
        if (walletId !== this.tonWallet.id) {
            throw new Error('Cannot add ton wallet to keystone account');
        }
    }
}

export class AccountTonOnly extends FallbackEmoji implements IAccount {
    public readonly type = 'ton-only';

    get allTonWallets() {
        return this.tonWallets;
    }

    get activeDerivationTonWallets() {
        return this.tonWallets;
    }

    get activeTonWallet() {
        return this.tonWallets.find(w => w.id === this.activeTonWalletId)!;
    }

    /**
     *  @param id ton public key hex string without 0x
     */
    constructor(
        public readonly id: AccountId,
        public name: string,
        public emoji: string,
        public readonly auth: AuthSigner | AuthSignerDeepLink,
        public activeTonWalletId: WalletId,
        public tonWallets: TonWalletStandard[]
    ) {
        super(emoji);
    }

    getTonWallet(id: WalletId) {
        return this.allTonWallets.find(w => w.id === id);
    }

    updateTonWallet(wallet: TonWalletStandard) {
        const index = this.tonWallets.findIndex(w => w.id === wallet.id)!;
        if (index === -1) {
            throw new Error('Wallet not found');
        }
        this.tonWallets[index] = wallet;
    }

    addTonWalletToActiveDerivation(wallet: TonWalletStandard) {
        const walletExists = this.tonWallets.findIndex(w => w.id === wallet.id);
        if (walletExists === -1) {
            this.tonWallets = this.tonWallets.concat(wallet);
        } else {
            this.tonWallets[walletExists] = wallet;
        }
    }

    removeTonWalletFromActiveDerivation(walletId: WalletId) {
        if (this.tonWallets.length === 1) {
            throw new Error('Cannot remove last wallet');
        }

        this.tonWallets = this.tonWallets.filter(w => w.id !== walletId);
        if (this.activeTonWalletId === walletId) {
            this.activeTonWalletId = this.tonWallets[0].id;
        }
    }

    setActiveTonWallet(walletId: WalletId) {
        if (this.tonWallets.every(w => w.id !== walletId)) {
            throw new Error('Wallet not found');
        }

        this.activeTonWalletId = walletId;
    }
}

export type Account = AccountTonMnemonic | AccountLedger | AccountKeystone | AccountTonOnly;

export type AccountsState = Account[];

export const defaultAccountState: AccountsState = [];

export function serializeAccount(account: Account): string {
    return JSON.stringify(account);
}

const prototypes = {
    mnemonic: AccountTonMnemonic.prototype,
    ledger: AccountLedger.prototype,
    keystone: AccountKeystone.prototype,
    'ton-only': AccountTonOnly.prototype
} as const;

export function bindAccountToClass(accountStruct: Account): void {
    Object.setPrototypeOf(accountStruct, prototypes[accountStruct.type]);
}

export function getWalletById(
    accounts: Account[],
    walletId: WalletId
): TonWalletStandard | undefined {
    for (const account of accounts || []) {
        const wallet = account.getTonWallet(walletId);
        if (wallet) {
            return wallet;
        }
    }
}

export function getAccountByWalletById(
    accounts: Account[],
    walletId: WalletId
): Account | undefined {
    for (const account of accounts || []) {
        const wallet = account.getTonWallet(walletId);
        if (wallet) {
            return account;
        }
    }
}
