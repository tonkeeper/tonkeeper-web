import {
    Address,
    beginCell,
    Builder,
    Cell,
    external,
    loadStateInit,
    storeMessage,
    storeMessageRelaxed
} from '@ton/core';
import { CellSigner } from '../../entries/signer';
import { TonWalletStandard, WalletVersion } from '../../entries/wallet';
import { walletContractFromState } from '../wallet/contractService';
import { MigrationTransaction } from './migrationApi';
import {
    MigrationBodyHeader,
    MigrationOutAction,
    MigrationVerificationContext,
    verifyMigrationTransaction
} from './migrationVerifier';

/**
 * Signing for backend-prepared migration transactions. The unsigned body is
 * always rebuilt locally from out actions that passed
 * `verifyMigrationTransaction` — the backend's body is never signed as-is,
 * and only its wallet id and valid-until survive into the rebuilt body.
 */

const OUT_ACTION_SEND_MSG_TAG = 0x0ec3c86d;

/** Wallet v5 requires the ignore-errors bit (+2) for external messages; otherwise exit code 137. */
const V5_IGNORE_ERRORS_MODE = 2;

export async function signMigrationTransaction({
    transaction,
    wallet,
    signer,
    context
}: {
    transaction: MigrationTransaction;
    wallet: TonWalletStandard;
    signer: CellSigner;
    context: MigrationVerificationContext;
}): Promise<Cell> {
    const { header, actions } = verifyMigrationTransaction(transaction, wallet.version, context);
    const unsignedBody = buildUnsignedBody(header, actions, transaction.seqno, wallet.version);
    const signature = await signer(unsignedBody);

    const bodyBuilder = beginCell();
    if (signatureGoesFirst(wallet.version)) {
        bodyBuilder.storeBuffer(signature).storeSlice(unsignedBody.beginParse());
    } else {
        bodyBuilder.storeSlice(unsignedBody.beginParse()).storeBuffer(signature);
    }

    return beginCell()
        .store(
            storeMessage(
                external({
                    to: Address.parse(wallet.rawAddress),
                    init: resolveStateInit(transaction, wallet),
                    body: bodyBuilder.endCell()
                })
            )
        )
        .endCell();
}

function signatureGoesFirst(version: WalletVersion): boolean {
    return version !== WalletVersion.V5_BETA && version !== WalletVersion.V5R1;
}

function resolveStateInit(transaction: MigrationTransaction, wallet: TonWalletStandard) {
    if (transaction.stateInit) {
        return loadStateInit(Cell.fromBase64(transaction.stateInit).beginParse());
    }
    if (transaction.seqno === 0) {
        return walletContractFromState(wallet).init;
    }
    return undefined;
}

function buildUnsignedBody(
    header: MigrationBodyHeader,
    actions: MigrationOutAction[],
    seqno: number,
    version: WalletVersion
): Cell {
    if (header.kind === 'v5') {
        const body = beginCell()
            .storeUint(header.opcode, 32)
            .storeInt(header.walletId, 32)
            .storeUint(header.validUntil, 32)
            .storeUint(seqno, 32);
        if (version === WalletVersion.V5R1) {
            return body.storeMaybeRef(buildV5OutList(actions)).storeBit(0).endCell();
        }
        return body.storeBit(0).storeRef(buildV5OutList(actions)).endCell();
    }

    const body = beginCell()
        .storeUint(header.walletId, 32)
        .storeUint(header.validUntil, 32)
        .storeUint(seqno, 32);
    if (version === WalletVersion.V4R1 || version === WalletVersion.V4R2) {
        body.storeUint(0, 8);
    }
    appendLegacyMessages(body, actions);
    return body.endCell();
}

function appendLegacyMessages(body: Builder, actions: MigrationOutAction[]): void {
    for (const action of actions) {
        body.storeUint(action.mode, 8).storeRef(encodeMessage(action));
    }
}

function buildV5OutList(actions: MigrationOutAction[]): Cell {
    let list = beginCell().endCell();
    for (const action of actions) {
        list = beginCell()
            .storeUint(OUT_ACTION_SEND_MSG_TAG, 32)
            .storeUint(action.mode | V5_IGNORE_ERRORS_MODE, 8)
            .storeRef(list)
            .storeRef(encodeMessage(action))
            .endCell();
    }
    return list;
}

function encodeMessage(action: MigrationOutAction): Cell {
    return beginCell().store(storeMessageRelaxed(action.message)).endCell();
}
