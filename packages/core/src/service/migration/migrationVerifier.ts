import { Address, Cell, loadMessageRelaxed, MessageRelaxed } from '@ton/core';
import { APIConfig } from '../../entries/apis';
import { isW5Version, WalletVersion } from '../../entries/wallet';
import { AccountsApi, JettonBalance, NFTApi, NftItem } from '../../tonApiV2';
import { MigrationTransaction } from './migrationApi';

/**
 * Local verification of a backend-prepared migration batch. Every out
 * message the wallet would send must move value to the user-chosen
 * destination — a plain transfer to it, or a jetton / NFT transfer through
 * a contract the source owns whose recipient is the destination. Transfer
 * excess may only return to the source, the destination, or — on a
 * Battery-sponsored transaction — Battery's excess account. Anything else
 * fails the whole batch, never a single message.
 *
 * Ownership of jetton wallets and NFT items comes from the tonapi indexer,
 * not from the migration endpoint.
 */

const JETTON_TRANSFER_OP = 0x0f8a7ea5;
const NFT_TRANSFER_OP = 0x5fcc3d14;
const V5_SIGNED_EXTERNAL_OP = 0x7369676e;
const V5_SIGNED_INTERNAL_OP = 0x73696e74;
const V4_SIMPLE_SEND_OP = 0;
const SEND_REMAINING_BALANCE_MODE = 128;

export class MigrationVerificationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MigrationVerificationError';
    }
}

export interface MigrationOutAction {
    mode: number;
    message: MessageRelaxed;
}

export type MigrationBodyHeader =
    | { kind: 'v5'; opcode: number; walletId: number; validUntil: number }
    | { kind: 'legacy'; walletId: number; validUntil: number };

export type MigrationTransfer =
    | { type: 'ton'; recipient: Address; amount: bigint; sendsRemainingBalance: boolean }
    | { type: 'jetton'; recipient: Address; amount: bigint; jetton: JettonBalance }
    | { type: 'nft'; recipient: Address; nft: NftItem };

export interface MigrationVerificationContext {
    source: Address;
    destination: Address;
    /** Jetton wallets the source owns, keyed by raw wallet address. */
    jettonWallets: Map<string, JettonBalance>;
    /** NFT items the source owns, keyed by raw item address. */
    nfts: Map<string, NftItem>;
    /** Battery's `excess_account`; set for the Battery batch. */
    batteryExcess?: Address;
}

export interface VerifiedMigrationTransaction {
    header: MigrationBodyHeader;
    actions: MigrationOutAction[];
    transfers: MigrationTransfer[];
}

export function verifyMigrationTransaction(
    transaction: MigrationTransaction,
    version: WalletVersion,
    context: MigrationVerificationContext
): VerifiedMigrationTransaction {
    const { header, actions } = parsePreparedTransaction(transaction, version);
    return {
        header,
        actions,
        transfers: actions.map(action => verifyAction(action, transaction.sponsored, context))
    };
}

export function verifyMigrationBatch(
    transactions: MigrationTransaction[],
    version: WalletVersion,
    context: MigrationVerificationContext
): VerifiedMigrationTransaction[] {
    return transactions.map(transaction =>
        verifyMigrationTransaction(transaction, version, context)
    );
}

export async function loadMigrationVerificationContext({
    api,
    source,
    destination,
    version,
    transactions,
    batteryExcessAccount
}: {
    api: APIConfig;
    source: string;
    destination: string;
    version: WalletVersion;
    transactions: MigrationTransaction[];
    batteryExcessAccount?: string;
}): Promise<MigrationVerificationContext> {
    const sourceAddress = Address.parse(source);

    const nftAddresses = new Set<string>();
    for (const transaction of transactions) {
        for (const { message } of parsePreparedTransaction(transaction, version).actions) {
            if (message.info.type === 'internal' && readOp(message.body) === NFT_TRANSFER_OP) {
                nftAddresses.add(message.info.dest.toRawString());
            }
        }
    }

    const [jettons, nfts] = await Promise.all([
        new AccountsApi(api.tonApiV2).getAccountJettonsBalances({
            accountId: sourceAddress.toRawString()
        }),
        nftAddresses.size > 0
            ? new NFTApi(api.tonApiV2).getNftItemsByAddresses({
                  getAccountsRequest: { accountIds: [...nftAddresses] }
              })
            : Promise.resolve({ nftItems: [] as NftItem[] })
    ]);

    return {
        source: sourceAddress,
        destination: Address.parse(destination),
        jettonWallets: new Map(
            jettons.balances.map(balance => [
                Address.parse(balance.walletAddress.address).toRawString(),
                balance
            ])
        ),
        nfts: new Map(
            nfts.nftItems
                .filter(
                    item => item.owner && Address.parse(item.owner.address).equals(sourceAddress)
                )
                .map(item => [Address.parse(item.address).toRawString(), item])
        ),
        batteryExcess: batteryExcessAccount ? Address.parse(batteryExcessAccount) : undefined
    };
}

export function isRemainingBalanceMode(mode: number): boolean {
    return (mode & SEND_REMAINING_BALANCE_MODE) !== 0;
}

function verifyAction(
    { mode, message }: MigrationOutAction,
    sponsored: boolean,
    context: MigrationVerificationContext
): MigrationTransfer {
    const { info, body } = message;
    if (info.type !== 'internal') {
        throw new MigrationVerificationError('Migration message is not an internal message');
    }
    if (info.dest.equals(context.destination)) {
        return {
            type: 'ton',
            recipient: info.dest,
            amount: info.value.coins,
            sendsRemainingBalance: isRemainingBalanceMode(mode)
        };
    }

    const target = info.dest.toRawString();
    const slice = body.beginParse();
    const op = slice.remainingBits >= 32 ? slice.loadUint(32) : undefined;

    if (op === JETTON_TRANSFER_OP) {
        const jetton = context.jettonWallets.get(target);
        if (!jetton) {
            throw new MigrationVerificationError(
                `Jetton transfer through ${target}, which is not a jetton wallet of the source`
            );
        }
        slice.loadUintBig(64);
        const amount = slice.loadCoins();
        const recipient = slice.loadAddress();
        assertExcessRecipient(slice.loadMaybeAddress(), sponsored, context);

        if (!recipient.equals(context.destination)) {
            throw new MigrationVerificationError(
                `Jetton transfer to ${recipient.toRawString()} instead of the migration destination`
            );
        }
        return { type: 'jetton', recipient, amount, jetton };
    }

    if (op === NFT_TRANSFER_OP) {
        const nft = context.nfts.get(target);
        if (!nft) {
            throw new MigrationVerificationError(
                `NFT transfer of ${target}, which the source does not own`
            );
        }
        slice.loadUintBig(64);
        const newOwner = slice.loadAddress();
        assertExcessRecipient(slice.loadMaybeAddress(), sponsored, context);

        if (!newOwner.equals(context.destination)) {
            throw new MigrationVerificationError(
                `NFT transfer to ${newOwner.toRawString()} instead of the migration destination`
            );
        }
        return { type: 'nft', recipient: newOwner, nft };
    }

    throw new MigrationVerificationError(
        `Migration message to ${target}, which is not the migration destination`
    );
}

function assertExcessRecipient(
    excess: Address | null,
    sponsored: boolean,
    context: MigrationVerificationContext
): void {
    if (
        excess === null ||
        excess.equals(context.source) ||
        excess.equals(context.destination) ||
        (sponsored && context.batteryExcess && excess.equals(context.batteryExcess))
    ) {
        return;
    }
    throw new MigrationVerificationError(
        `Transfer excess goes to ${excess.toRawString()}, outside the migration`
    );
}

function readOp(body: Cell): number | undefined {
    const slice = body.beginParse();
    return slice.remainingBits >= 32 ? slice.loadUint(32) : undefined;
}

/**
 * Header fields and out actions of a prepared transaction. The actions come
 * only from `messages`; the prepared body contributes nothing but its header,
 * so a transaction without messages is rejected rather than signed from a
 * body nobody parsed. Header fields that would change what the wallet does —
 * the v5 auth opcode, the v4 operation — must hold their plain-send values.
 * A sponsored v5 body may be signed-internal: the Battery relay delivers it
 * to the wallet as an internal message.
 */
function parsePreparedTransaction(
    transaction: MigrationTransaction,
    version: WalletVersion
): { header: MigrationBodyHeader; actions: MigrationOutAction[] } {
    if (transaction.messages.length === 0) {
        throw new MigrationVerificationError('Migration transaction has no messages');
    }
    const body = Cell.fromBase64(transaction.boc).beginParse();

    if (isW5Version(version)) {
        const opcode = body.loadUint(32);
        const allowedOpcodes = transaction.sponsored
            ? [V5_SIGNED_EXTERNAL_OP, V5_SIGNED_INTERNAL_OP]
            : [V5_SIGNED_EXTERNAL_OP];
        if (!allowedOpcodes.includes(opcode)) {
            throw new MigrationVerificationError(`Unexpected wallet v5 opcode ${opcode}`);
        }
        const walletId = body.loadInt(32);
        const validUntil = body.loadUint(32);
        return {
            header: { kind: 'v5', opcode, walletId, validUntil },
            actions: decodeMessages(transaction)
        };
    }

    const walletId = body.loadUint(32);
    const validUntil = body.loadUint(32);
    body.loadUint(32);
    if (version === WalletVersion.V4R1 || version === WalletVersion.V4R2) {
        const op = body.loadUint(8);
        if (op !== V4_SIMPLE_SEND_OP) {
            throw new MigrationVerificationError(`Unexpected wallet v4 operation ${op}`);
        }
    }
    return {
        header: { kind: 'legacy', walletId, validUntil },
        actions: decodeMessages(transaction)
    };
}

function decodeMessages(transaction: MigrationTransaction): MigrationOutAction[] {
    return transaction.messages.map(message => ({
        mode: message.mode,
        message: loadMessageRelaxed(Cell.fromBase64(message.boc).beginParse())
    }));
}
