/**
 * Signer snapshot harness — Phase 1 / Track G.
 *
 * For each (fixture × WalletVersion × Network), this module reproduces the
 * dispatch in `getSigner()` (uikit/state/mnemonic.ts) using only the
 * underlying primitives from `@tonkeeper/core`. The output is a signed
 * transfer BOC; ed25519 is deterministic, so the BOC is reproducible
 * byte-for-byte.
 *
 * Why core-only (no uikit): the Phase 1 refactor (B / C) reorganizes the
 * dispatch but keeps `mnemonicToKeypair`, `walletContract`, and
 * `signWithSecret` as the underlying primitives. As long as those produce
 * the same outputs, the harness can detect any divergence introduced by
 * the factory split.
 */

import { TonKeychainRoot } from '@ton-keychain/core';
import { Address, beginCell, Cell, internal, MessageRelaxed, SendMode, toNano } from '@ton/core';
import { sign } from '@ton/crypto';

import { Network } from '../../../entries/network';
import { mnemonicToKeypair } from '../../../service/mnemonicService';
import { signWithSecret } from '../../../service/sign';
import { walletContract } from '../../../service/wallet/contractService';
import { WalletVersion } from '../../../entries/wallet';

import {
    CANONICAL_TRANSFER,
    FIXTURE_BIP39_MNEMONIC,
    FIXTURE_MAM_CHILD_INDEX,
    FIXTURE_MAM_ROOT_MNEMONIC,
    FIXTURE_SK_ED25519_SEED,
    FIXTURE_TON_MNEMONIC,
    FIXTURE_TON_ONLY_MOCK_SIGNATURE,
    FIXTURE_TON_ONLY_PUBLIC_KEY_HEX
} from './fixtures';

/**
 * Account-type axis the snapshot covers. Matches the `case` labels in
 * `getSigner()` that produce a CellSigner. Watch-only and multisig are
 * excluded — they can't produce a signature locally.
 */
export type FixtureKind = 'mnemonic-ton' | 'mnemonic-bip39' | 'testnet' | 'mam' | 'sk' | 'ton-only';

export const FIXTURE_KINDS: ReadonlyArray<FixtureKind> = [
    'mnemonic-ton',
    'mnemonic-bip39',
    'testnet',
    'mam',
    'sk',
    'ton-only'
];

type CellSigner = (message: Cell) => Promise<Buffer>;

interface ResolvedFixture {
    publicKey: Buffer;
    signer: CellSigner;
}

const resolveFixture = async (kind: FixtureKind): Promise<ResolvedFixture> => {
    switch (kind) {
        case 'mnemonic-ton': {
            const keyPair = await mnemonicToKeypair(FIXTURE_TON_MNEMONIC, 'ton');
            return {
                publicKey: Buffer.from(keyPair.publicKey),
                signer: async (message: Cell) => sign(message.hash(), keyPair.secretKey)
            };
        }
        case 'mnemonic-bip39': {
            const keyPair = await mnemonicToKeypair(FIXTURE_BIP39_MNEMONIC, 'bip39');
            return {
                publicKey: Buffer.from(keyPair.publicKey),
                signer: async (message: Cell) => sign(message.hash(), keyPair.secretKey)
            };
        }
        case 'testnet': {
            // `testnet` account type uses the same dispatch as `mnemonic` —
            // distinguished only by network at the contract layer.
            const keyPair = await mnemonicToKeypair(FIXTURE_TON_MNEMONIC, 'ton');
            return {
                publicKey: Buffer.from(keyPair.publicKey),
                signer: async (message: Cell) => sign(message.hash(), keyPair.secretKey)
            };
        }
        case 'mam': {
            const root = await TonKeychainRoot.fromMnemonic(FIXTURE_MAM_ROOT_MNEMONIC, {
                allowLegacyMnemonic: true
            });
            const tonAccount = await root.getTonAccount(FIXTURE_MAM_CHILD_INDEX);
            const keyPair = await mnemonicToKeypair(tonAccount.mnemonics, 'ton');
            return {
                publicKey: Buffer.from(keyPair.publicKey),
                signer: async (message: Cell) => sign(message.hash(), keyPair.secretKey)
            };
        }
        case 'sk': {
            // Mirrors `case 'sk'` in getSigner: signWithSecret(message.hash(), { key, algorithm }).
            const { default: nacl } = await import('tweetnacl');
            const keyPair = nacl.sign.keyPair.fromSeed(Buffer.from(FIXTURE_SK_ED25519_SEED, 'hex'));
            return {
                publicKey: Buffer.from(keyPair.publicKey),
                signer: async (message: Cell) =>
                    signWithSecret(message.hash(), {
                        key: FIXTURE_SK_ED25519_SEED,
                        algorithm: 'ed25519'
                    })
            };
        }
        case 'ton-only': {
            // No keypair locally. Production goes through pairSignerByNotification;
            // the snapshot uses a deterministic mock signature so we can lock in the
            // *transfer cell shape* — i.e., the message the dispatch would send to
            // the external signer.
            return {
                publicKey: Buffer.from(FIXTURE_TON_ONLY_PUBLIC_KEY_HEX, 'hex'),
                signer: async () => FIXTURE_TON_ONLY_MOCK_SIGNATURE
            };
        }
    }
};

const buildCanonicalMessage = (): MessageRelaxed => {
    const body = beginCell()
        .storeUint(0, 32) // text-comment op
        .storeStringTail(CANONICAL_TRANSFER.comment)
        .endCell();

    return internal({
        to: Address.parseRaw(CANONICAL_TRANSFER.toAddressRaw),
        value: toNano('1'), // matches CANONICAL_TRANSFER.valueNano = 1_000_000_000n
        bounce: false,
        body
    });
};

export interface ComboSnapshot {
    /** Fixture × version × network combo identifier — used as the JSON filename stem. */
    comboId: string;
    /** Public key in hex. Lets reviewers eyeball that key derivation didn't drift. */
    publicKeyHex: string;
    /** The wallet contract's friendly address (workchain 0). */
    address: string;
    /** Base64 of `transfer.toBoc({ idx: false })` — the artifact under regression. */
    transferBocBase64: string;
}

/**
 * @internal Used by harness consumers — kept exported so a future Track B
 * refactored factory can be wired in here and produce the same output.
 */
export const buildSnapshot = async (
    kind: FixtureKind,
    version: WalletVersion,
    network: Network
): Promise<ComboSnapshot> => {
    const { publicKey, signer } = await resolveFixture(kind);

    // V5_BETA's contract factory expects only a network/walletId arg, not a workchain.
    // walletContract() handles that internally.
    const contract = walletContract(publicKey, version, network);

    // Cast to access createTransfer with the `signer` overload uniformly across
    // V3/V4/V5 — @ton/ton's type union for V3/V4 returns `Cell | Promise<Cell>`,
    // which TS can't narrow without picking a specific class. The runtime
    // signature is identical across versions when `signer` is passed.
    const transfer = (await (contract as TonWalletContractWithSigner).createTransfer({
        seqno: CANONICAL_TRANSFER.seqno,
        signer,
        timeout: CANONICAL_TRANSFER.timeout,
        messages: [buildCanonicalMessage()],
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
    })) as Cell;

    return {
        comboId: comboIdFor(kind, version, network),
        publicKeyHex: publicKey.toString('hex'),
        address: contract.address.toString({ urlSafe: true, bounceable: true, testOnly: false }),
        transferBocBase64: transfer.toBoc({ idx: false }).toString('base64')
    };
};

/**
 * The set of TonWallet contract classes uniformly support `createTransfer` with
 * a `signer` callback in @ton/ton ≥ 16, but their TS unions differ. This local
 * alias narrows to the shape we actually call.
 */
type TonWalletContractWithSigner = {
    address: ReturnType<typeof walletContract>['address'];
    createTransfer: (args: {
        seqno: number;
        signer: CellSigner;
        timeout: number;
        messages: MessageRelaxed[];
        sendMode: SendMode;
    }) => Promise<Cell>;
};

export const comboIdFor = (kind: FixtureKind, version: WalletVersion, network: Network): string => {
    const versionPart = WalletVersion[version]; // e.g. 'V5R1'
    const networkPart = network === Network.MAINNET ? 'MAINNET' : 'TESTNET';
    return `${kind}__${versionPart}__${networkPart}`;
};
