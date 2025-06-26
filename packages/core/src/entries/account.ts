// eslint-disable-next-line max-classes-per-file
import { KeystonePathInfo } from '../service/keystone/types';
import {
    AuthKeychain,
    AuthPassword,
    AuthSigner,
    AuthSignerDeepLink,
    MnemonicType
} from './password';
import {
    DerivationItem,
    TonContract,
    TonWalletStandard,
    WalletId,
    DerivationItemNamed
} from './wallet';
import { assertUnreachable } from '../utils/types';
import { Network } from './network';
import { TronWallet } from './tron/tron-wallet';
import { SKSigningAlgorithm } from '../service/sign';

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

export interface IAccountTonWalletStandard extends IAccount {
    get allTonWallets(): TonWalletStandard[];
    get activeTonWallet(): TonWalletStandard;

    getTonWallet(id: WalletId): TonWalletStandard | undefined;
    setActiveTonWallet(walletId: WalletId): void;
}

export interface IAccountVersionsEditable extends IAccountTonWalletStandard {
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

abstract class TonMnemonic extends Clonable implements IAccountVersionsEditable {
    /**
     * undefined for old wallets
     */
    readonly tronWallet: TronWallet | undefined;

    get allTonWallets() {
        return this.tonWallets;
    }

    get activeTonWallet() {
        return this.tonWallets.find(w => w.id === this.activeTonWalletId)!;
    }

    get activeTronWallet() {
        return this.tronWallet;
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
        public tonWallets: TonWalletStandard[],
        public mnemonicType?: MnemonicType,
        networks?: {
            tron: TronWallet;
        }
    ) {
        super();
        this.tronWallet = networks?.tron;
    }

    getTronWallet(id: WalletId) {
        if (id === this.activeTronWallet?.id) {
            return this.activeTronWallet;
        }

        return undefined;
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
export class AccountTonMnemonic extends TonMnemonic {
    public readonly type = 'mnemonic';

    static create(params: {
        id: AccountId;
        name: string;
        emoji: string;
        auth: AuthPassword | AuthKeychain;
        activeTonWalletId: WalletId;
        tonWallets: TonWalletStandard[];
        mnemonicType: MnemonicType;
        networks?: {
            tron: TronWallet;
        };
    }) {
        return new AccountTonMnemonic(
            params.id,
            params.name,
            params.emoji,
            params.auth,
            params.activeTonWalletId,
            params.tonWallets,
            params.mnemonicType,
            params.networks
        );
    }
}

export class AccountTonTestnet extends TonMnemonic {
    public readonly type = 'testnet';

    static create(params: {
        id: AccountId;
        name: string;
        emoji: string;
        auth: AuthPassword | AuthKeychain;
        activeTonWalletId: WalletId;
        tonWallets: TonWalletStandard[];
        mnemonicType: MnemonicType;
    }) {
        return new AccountTonTestnet(
            params.id,
            params.name,
            params.emoji,
            params.auth,
            params.activeTonWalletId,
            params.tonWallets,
            params.mnemonicType
        );
    }
}

export class AccountTonSK extends TonMnemonic {
    public readonly type = 'sk';

    constructor(
        id: AccountId,
        name: string,
        emoji: string,
        auth: AuthPassword | AuthKeychain,
        activeTonWalletId: WalletId,
        tonWallets: TonWalletStandard[],
        /**
         * Undefined for existing accounts, set to 'ed25519'
         */
        public readonly signingAlgorithm: SKSigningAlgorithm = 'ed25519'
    ) {
        super(id, name, emoji, auth, activeTonWalletId, tonWallets);
    }

    static create(params: {
        id: AccountId;
        name: string;
        emoji: string;
        auth: AuthPassword | AuthKeychain;
        activeTonWalletId: WalletId;
        tonWallets: TonWalletStandard[];
        signingAlgorithm: SKSigningAlgorithm;
    }) {
        return new AccountTonSK(
            params.id,
            params.name,
            params.emoji,
            params.auth,
            params.activeTonWalletId,
            params.tonWallets,
            params.signingAlgorithm
        );
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

export class AccountLedger extends Clonable implements IAccountTonWalletStandard {
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

export class AccountKeystone extends Clonable implements IAccountTonWalletStandard {
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

/**
 * Represents Tonkeeper Signer
 */
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

export class AccountMAM extends Clonable implements IAccountTonWalletStandard {
    static getNewDerivationFallbackName(index = 0) {
        return 'Wallet ' + (index + 1);
    }

    public readonly type = 'mam';

    get derivations() {
        return this.addedDerivationsIndexes.map(
            index => this.allAvailableDerivations.find(d => d.index === index)!
        );
    }

    get lastAddedIndex() {
        return this.allAvailableDerivations.reduce((acc, v) => Math.max(acc, v.index), -1);
    }

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

    get activeTronWallet() {
        const activeDerivation = this.activeDerivation;
        return activeDerivation.tronWallet;
    }

    /**
     *  @param id index 0 derivation ton public key hex string without 0x
     */
    constructor(
        public readonly id: AccountId,
        public name: string,
        public emoji: string,
        public auth: AuthPassword | AuthKeychain,
        public activeDerivationIndex: number,
        public addedDerivationsIndexes: number[],
        public allAvailableDerivations: DerivationItemNamed[]
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

    getTronWallet(id: WalletId) {
        return this.derivations.map(d => d.tronWallet).find(item => item?.id === id);
    }

    getTonWalletsDerivation(id: WalletId) {
        return this.allAvailableDerivations.find(d => d.tonWallets.some(w => w.id === id));
    }

    updateDerivation(newDerivation: DerivationItemNamed) {
        const indexToPaste = this.allAvailableDerivations.findIndex(
            d => d.index === newDerivation.index
        );
        if (indexToPaste !== -1) {
            this.allAvailableDerivations[indexToPaste] = newDerivation;
        }
    }

    addDerivation(derivation: DerivationItemNamed) {
        const derivationExists = this.derivations.find(d => d.index === derivation.index);
        if (derivationExists) {
            throw new Error('Derivation already exists');
        }

        this.allAvailableDerivations.push(derivation);
        this.addedDerivationsIndexes.push(derivation.index);
    }

    enableDerivation(derivationIndex: number) {
        if (this.allAvailableDerivations.every(d => d.index !== derivationIndex)) {
            throw new Error('Derivation not found');
        }

        this.addedDerivationsIndexes.push(derivationIndex);
    }

    hideDerivation(derivationIndex: number) {
        if (this.derivations.length === 1) {
            throw new Error('Cannot remove last derivation');
        }

        this.addedDerivationsIndexes = this.addedDerivationsIndexes.filter(
            d => d !== derivationIndex
        );
        if (this.activeDerivationIndex === derivationIndex) {
            this.activeDerivationIndex = this.addedDerivationsIndexes[0];
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
        if (this.derivations.every(d => d.index !== index)) {
            throw new Error('Derivation not found');
        }

        this.activeDerivationIndex = index;
    }

    getNewDerivationFallbackName() {
        return 'Wallet ' + (this.lastAddedIndex + 2);
    }
}

export class AccountTonMultisig extends Clonable implements IAccount {
    public readonly type = 'ton-multisig';

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
        public tonWallet: TonContract,
        public hostWallets: {
            address: string;
            isPinned: boolean;
        }[],
        public selectedHostWalletId: WalletId
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

    setSelectedHostWalletId(walletId: WalletId) {
        if (!this.hostWallets.some(w => w.address === walletId)) {
            throw new Error('Host wallet not found');
        }

        this.selectedHostWalletId = walletId;
    }

    setHostWallets(wallets: { address: string; isPinned: boolean }[]) {
        this.hostWallets = wallets;
        if (!this.hostWallets.some(w => w.address === this.selectedHostWalletId)) {
            this.selectedHostWalletId = this.hostWallets[0].address;
        }
    }

    addHostWallet(wallet: WalletId) {
        if (this.hostWallets.some(w => w.address === wallet)) {
            return;
        }

        this.hostWallets.push({ address: wallet, isPinned: false });
    }

    removeHostWallet(wallet: WalletId) {
        this.hostWallets = this.hostWallets.filter(w => w.address !== wallet);
    }

    togglePinForWallet(walletId: WalletId) {
        if (!this.hostWallets.some(w => w.address === walletId)) {
            throw new Error('Host wallet not found');
        }

        this.hostWallets = this.hostWallets.map(w => {
            if (w.address === walletId) {
                return { ...w, isPinned: !w.isPinned };
            }

            return w;
        });
    }

    isPinnedForWallet(walletId: WalletId) {
        return this.hostWallets.find(w => w.address === walletId)?.isPinned ?? false;
    }
}

export type AccountVersionEditable =
    | AccountTonMnemonic
    | AccountTonOnly
    | AccountTonTestnet
    | AccountTonSK;

export type AccountTonWalletStandard =
    | AccountVersionEditable
    | AccountLedger
    | AccountKeystone
    | AccountMAM;

export type Account = AccountTonWalletStandard | AccountTonWatchOnly | AccountTonMultisig;

export function isAccountVersionEditable(account: Account): account is AccountVersionEditable {
    switch (account.type) {
        case 'mnemonic':
        case 'ton-only':
        case 'testnet':
        case 'sk':
            return true;
        case 'ledger':
        case 'keystone':
        case 'watch-only':
        case 'mam':
        case 'ton-multisig':
            return false;
        default:
            return assertUnreachable(account);
    }
}

export function isAccountTonWalletStandard(account: Account): account is AccountTonWalletStandard {
    switch (account.type) {
        case 'keystone':
        case 'mnemonic':
        case 'ledger':
        case 'ton-only':
        case 'mam':
        case 'testnet':
        case 'sk':
            return true;
        case 'watch-only':
        case 'ton-multisig':
            return false;
        default:
            return assertUnreachable(account);
    }
}

export function isAccountSupportTonConnect(account: Account): boolean {
    switch (account.type) {
        case 'keystone':
        case 'mnemonic':
        case 'ledger':
        case 'ton-only':
        case 'mam':
        case 'testnet':
        case 'sk':
        case 'ton-multisig':
            return true;
        case 'watch-only':
            return false;
        default:
            return assertUnreachable(account);
    }
}

export function isAccountCanManageMultisigs(account: Account): boolean {
    switch (account.type) {
        case 'mnemonic':
        case 'ton-only':
        case 'mam':
        case 'ledger':
        case 'sk':
            return true;
        case 'watch-only':
        case 'ton-multisig':
        case 'keystone':
        case 'testnet':
            return false;
        default:
            return assertUnreachable(account);
    }
}

export function isMnemonicAndPassword(
    account: Account
): account is AccountTonMnemonic | AccountTonTestnet | AccountMAM {
    switch (account.type) {
        case 'mam':
        case 'mnemonic':
        case 'testnet':
        case 'sk':
            return true;
        case 'ton-only':
        case 'ledger':
        case 'watch-only':
        case 'ton-multisig':
        case 'keystone':
            return false;
        default:
            return assertUnreachable(account);
    }
}

export function getNetworkByAccount(account: Account): Network {
    switch (account.type) {
        case 'testnet':
            return Network.TESTNET;
        case 'mam':
        case 'mnemonic':
        case 'ton-only':
        case 'ledger':
        case 'watch-only':
        case 'ton-multisig':
        case 'keystone':
        case 'sk':
            return Network.MAINNET;
        default:
            assertUnreachable(account);
    }
}

export function seeIfMainnnetAccount(account: Account): boolean {
    const network = getNetworkByAccount(account);
    return network === Network.MAINNET;
}

export function isAccountTronCompatible(
    account: Account
): account is AccountTonMnemonic | AccountMAM {
    switch (account.type) {
        case 'mnemonic':
        case 'mam':
            return true;
        case 'testnet':
        case 'ton-only':
        case 'ledger':
        case 'watch-only':
        case 'ton-multisig':
        case 'keystone':
        case 'sk':
            return false;
        default:
            return assertUnreachable(account);
    }
}

export function isAccountBip39(account: Account) {
    switch (account.type) {
        case 'testnet':
        case 'mnemonic':
            return account.mnemonicType === 'bip39';
        case 'mam':
        case 'ton-only':
        case 'ledger':
        case 'watch-only':
        case 'ton-multisig':
        case 'keystone':
        case 'sk':
            return false;
        default:
            return assertUnreachable(account);
    }
}

export type AccountsState = Account[];

export const defaultAccountState: AccountsState = [];

export function serializeAccount(account: Account): string {
    return JSON.stringify(account);
}

const prototypes = {
    mnemonic: AccountTonMnemonic.prototype,
    testnet: AccountTonTestnet.prototype,
    ledger: AccountLedger.prototype,
    keystone: AccountKeystone.prototype,
    'ton-only': AccountTonOnly.prototype,
    'watch-only': AccountTonWatchOnly.prototype,
    mam: AccountMAM.prototype,
    'ton-multisig': AccountTonMultisig.prototype,
    sk: AccountTonSK.prototype
} as const;

export function bindAccountToClass(accountStruct: Account): void {
    Object.setPrototypeOf(accountStruct, prototypes[accountStruct.type]);
}

export function getWalletById(accounts: Account[], walletId: WalletId): TonContract | undefined {
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

export type AccountsFolderStored = {
    id: string;
    type: 'folder';
    accounts: AccountId[];
    name: string;
    lastIsOpened: boolean;
};

export type AccountSecretMnemonic = {
    type: 'mnemonic';
    mnemonic: string[];
};

export type AccountSecretSK = {
    type: 'sk';
    sk: string;
};

export type AccountSecret = AccountSecretMnemonic | AccountSecretSK;
