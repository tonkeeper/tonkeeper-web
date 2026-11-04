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
    MultichainWallet,
    TonContract,
    TonWalletStandard,
    WalletId,
    DerivationItemNamed,
    isStandardTonWallet
} from './wallet';
import { assertUnreachable } from '../utils/types';
import { Network } from './network';
import { TronWallet } from './tron/tron-wallet';
import { SKSigningAlgorithm } from '../service/sign';
import { ChainId } from '../chains/types';

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

    get signingAlgorithm() {
        return this._signingAlgorithm ?? 'ed25519';
    }

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
        private readonly _signingAlgorithm?: SKSigningAlgorithm
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

/**
 * Multichain account. Holds a single BIP39 seed (encrypted under `auth`,
 * same shape `AccountTonMnemonic` uses) and a flat list of per-chain
 * wallets derived from that seed.
 *
 * Invariant: every `AccountMultichain` must include `'ton'` in
 * `enabledChains` and carry at least one `TonWalletStandard` in
 * `wallets`. Enforced in the constructor. This keeps `activeTonWallet`
 * a total function — call sites that read `account.activeTonWallet`
 * never see `undefined` from a type that nominally returns
 * `TonWalletStandard`.
 */
export class AccountMultichain extends Clonable implements IAccountTonWalletStandard {
    public readonly type = 'multichain';

    get allTonWallets(): TonWalletStandard[] {
        return this.wallets.filter(isStandardTonWallet);
    }

    get activeTonWallet(): TonWalletStandard {
        const tonWallets = this.allTonWallets;
        const id = this.activeWalletByChain.ton;
        const active = tonWallets.find(w => w.id === id);
        // Constructor invariants guarantee `active` is defined; the
        // fallback to `tonWallets[0]` is belt-and-braces for callers that
        // mutate the account state outside the setters below.
        return active ?? tonWallets[0];
    }

    /**
     * @param id Stable account id (derived from the BIP39 seed at boot).
     */
    constructor(
        public readonly id: AccountId,
        public name: string,
        public emoji: string,
        public auth: AuthPassword | AuthKeychain,
        public enabledChains: ChainId[],
        public activeWalletByChain: Partial<Record<ChainId, WalletId>>,
        public wallets: MultichainWallet[],
        /**
         * Identifier the multichain backend keys on. New accounts carry
         * the format-2 id (36-char base32, `ai…` — see
         * `deriveMultichainWalletAuth`); accounts from before that
         * migration hold the legacy sha256-hex id the backend no longer
         * accepts, and accounts older still have nothing. Without a
         * format-2 id the multichain endpoints cannot be called and the
         * portfolio falls back to TON+TRON data only — re-importing the
         * mnemonic upgrades the account.
         */
        public multichainWalletId?: string,
        /**
         * Root secp256k1 private key of the wallet-auth derivation path,
         * 32 bytes hex. Proves wallet ownership to the multichain
         * backend (register proof, `X-Wallet-Authorization`); no chain
         * derives spending keys from it. Absent on accounts created
         * before wallet auth landed — their requests degrade to
         * device-JWT-only, which the backend accepts for wallets already
         * bound to the device.
         */
        public walletAuthKey?: string
    ) {
        super();

        if (!enabledChains.includes('ton')) {
            throw new Error("AccountMultichain v1 requires 'ton' in enabledChains");
        }

        const tonWallets = this.wallets.filter(isStandardTonWallet);
        if (tonWallets.length === 0) {
            throw new Error('AccountMultichain requires at least one TonWalletStandard in wallets');
        }

        const activeTonId = activeWalletByChain.ton;
        if (!activeTonId) {
            throw new Error('AccountMultichain requires activeWalletByChain.ton');
        }
        if (!tonWallets.some(w => w.id === activeTonId)) {
            throw new Error('activeWalletByChain.ton does not match any TON wallet');
        }
    }

    getTonWallet(id: WalletId): TonWalletStandard | undefined {
        return this.allTonWallets.find(w => w.id === id);
    }

    setActiveTonWallet(walletId: WalletId): void {
        if (!this.allTonWallets.some(w => w.id === walletId)) {
            throw new Error('Wallet not found');
        }
        this.activeWalletByChain = { ...this.activeWalletByChain, ton: walletId };
    }

    /**
     * Returns the active wallet on this account for the given chain, or
     * `undefined` if the chain is not enabled or has no active wallet.
     * The runtime backbone behind `selectActiveWalletForChain` for
     * multichain accounts. Return type is `MultichainWallet` — the
     * dispatcher in `chains/wallet-selector.ts` narrows it via the
     * `WalletForChain<C>` map.
     */
    getWalletByChain(chain: ChainId): MultichainWallet | undefined {
        const id = this.activeWalletByChain[chain];
        if (id === undefined) return undefined;
        const wallet = this.wallets.find(w => w.id === id);
        if (!wallet) return undefined;
        if (chain === 'ton') return isStandardTonWallet(wallet) ? wallet : undefined;
        return 'chain' in wallet && wallet.chain === chain ? wallet : undefined;
    }

    static create(params: {
        id: AccountId;
        name: string;
        emoji: string;
        auth: AuthPassword | AuthKeychain;
        enabledChains: ChainId[];
        activeWalletByChain: Partial<Record<ChainId, WalletId>>;
        wallets: MultichainWallet[];
        multichainWalletId?: string;
        walletAuthKey?: string;
    }) {
        return new AccountMultichain(
            params.id,
            params.name,
            params.emoji,
            params.auth,
            params.enabledChains,
            params.activeWalletByChain,
            params.wallets,
            params.multichainWalletId,
            params.walletAuthKey
        );
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
    | AccountMAM
    | AccountMultichain;

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
        case 'multichain':
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
        case 'multichain':
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
        case 'multichain':
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
        // Multisig hosting on a multichain account is not supported —
        // the multisig flow is tied to legacy mnemonic accounts.
        case 'multichain':
            return false;
        default:
            return assertUnreachable(account);
    }
}

/**
 * Accounts holding a secret encrypted with the app password (or held in the
 * keychain). This is the set the password services operate on — validating,
 * changing, and re-encrypting the app password.
 *
 * Distinct from `isMnemonicAndPassword`, which is narrower on purpose: that one
 * gates legacy TON-only mnemonic edit flows and so excludes multichain.
 * Password handling must not use it — a multichain-only profile would look like
 * it has no password at all.
 */
export function isSecretBearingAccount(
    account: Account
): account is
    | AccountTonMnemonic
    | AccountTonTestnet
    | AccountTonSK
    | AccountMAM
    | AccountMultichain {
    switch (account.type) {
        case 'mam':
        case 'mnemonic':
        case 'testnet':
        case 'sk':
        case 'multichain':
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
        // Multichain seeds also unlock by password/keychain, but the
        // call sites of this predicate gate legacy TON-only mnemonic
        // editing flows that mutate `tonWallets` directly. Excluded so
        // those flows don't trip over the multichain shape.
        case 'multichain':
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
        case 'multichain':
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
        // The legacy TRON channel (DerivationItem.tronWallet) is tied to
        // mnemonic/MAM accounts. Multichain accounts carry TRON via
        // `MultichainTronWallet` in `wallets` — a different channel.
        case 'multichain':
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
        // AccountMultichain is BIP39 by construction (single seed used
        // across chains). Predicate returns true regardless of any
        // future mnemonicType field.
        case 'multichain':
            return true;
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
    sk: AccountTonSK.prototype,
    multichain: AccountMultichain.prototype
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
