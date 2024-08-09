// eslint-disable-next-line max-classes-per-file
import { KeystonePathInfo } from '../service/keystone/types';
import { AuthKeychain, AuthPassword, AuthSigner, AuthSignerDeepLink } from './password';
import { DerivationItem, TonContract, TonWalletStandard, WalletId } from './wallet';
import { assertUnreachable } from '../utils/types';

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

    get allTonWallets(): TonContract[];
    get activeTonWallet(): TonContract;

    getTonWallet(id: WalletId): TonContract | undefined;
    setActiveTonWallet(walletId: WalletId): void;
}

export interface IAccountControllable extends IAccount {
    get allTonWallets(): TonWalletStandard[];
    get activeTonWallet(): TonWalletStandard;

    getTonWallet(id: WalletId): TonWalletStandard | undefined;
    setActiveTonWallet(walletId: WalletId): void;
}

export interface IAccountVersionsEditable extends IAccountControllable {
    addTonWalletToActiveDerivation(wallet: TonWalletStandard): void;
    removeTonWalletFromActiveDerivation(walletId: WalletId): void;
}

export class Clonable {
    clone() {
        const cloned = structuredClone(this);
        Object.setPrototypeOf(cloned, Object.getPrototypeOf(this));
        return cloned as this;
    }
}

export class AccountTonMnemonic extends Clonable implements IAccountVersionsEditable {
    public readonly type = 'mnemonic';

    get allTonWallets() {
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
        super();
    }

    getTonWallet(id: WalletId) {
        return this.allTonWallets.find(w => w.id === id);
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

export class AccountTonWatchOnly extends Clonable implements IAccount {
    public readonly type = 'watch-only';

    get allTonWallets() {
        return [this.tonWallet];
    }

    get activeTonWallet() {
        return this.tonWallet;
    }

    /**
     *  @param id eq to `tonWallet.id`
     */
    constructor(
        public readonly id: AccountId,
        public name: string,
        public emoji: string,
        public tonWallet: TonContract
    ) {
        super();
    }

    getTonWallet(id: WalletId) {
        if (id !== this.tonWallet.id) {
            return undefined;
        }

        return this.tonWallet;
    }

    setActiveTonWallet(walletId: WalletId) {
        if (walletId !== this.tonWallet.id) {
            throw new Error('Cannot add ton wallet to watch only account');
        }
    }
}

export class AccountLedger extends Clonable implements IAccountControllable {
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
        super();

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

export class AccountKeystone extends Clonable implements IAccountControllable {
    public readonly type = 'keystone';

    get allTonWallets() {
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
        super();
    }

    getTonWallet(id: WalletId) {
        return this.allTonWallets.find(w => w.id === id);
    }

    setActiveTonWallet(walletId: WalletId) {
        if (walletId !== this.tonWallet.id) {
            throw new Error('Cannot add ton wallet to keystone account');
        }
    }
}

export class AccountTonOnly extends Clonable implements IAccountVersionsEditable {
    public readonly type = 'ton-only';

    get allTonWallets() {
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
        super();
    }

    getTonWallet(id: WalletId) {
        return this.allTonWallets.find(w => w.id === id);
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

export type AccountVersionEditable = AccountTonMnemonic | AccountTonOnly;

export type AccountControllable = AccountVersionEditable | AccountLedger | AccountKeystone;

export type Account = AccountControllable | AccountTonWatchOnly;

export function isAccountVersionEditable(account: Account): account is AccountVersionEditable {
    switch (account.type) {
        case 'mnemonic':
        case 'ton-only':
            return true;
        case 'ledger':
        case 'keystone':
        case 'watch-only':
            return false;
    }

    assertUnreachable(account);
}

export function isAccountControllable(account: Account): account is AccountControllable {
    switch (account.type) {
        case 'keystone':
        case 'mnemonic':
        case 'ledger':
        case 'ton-only':
            return true;
        case 'watch-only':
            return false;
    }

    assertUnreachable(account);
}

export type AccountsState = Account[];

export const defaultAccountState: AccountsState = [];

export function serializeAccount(account: Account): string {
    return JSON.stringify(account);
}

const prototypes = {
    mnemonic: AccountTonMnemonic.prototype,
    ledger: AccountLedger.prototype,
    keystone: AccountKeystone.prototype,
    'ton-only': AccountTonOnly.prototype,
    'watch-only': AccountTonWatchOnly.prototype
} as const;

export function bindAccountToClass(accountStruct: Account): void {
    Object.setPrototypeOf(accountStruct, prototypes[accountStruct.type]);
}

export function getWalletById(
    accounts: IAccountControllable[],
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
