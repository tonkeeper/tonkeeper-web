import { Address, beginCell, Cell, loadMessageRelaxed, storeMessageRelaxed } from '@ton/core';
import { Configuration as BatteryConfiguration, DefaultApi } from '../../batteryApi';
import { delay } from '../../utils/common';
import { MigrationTransaction } from './migrationApi';

const JETTON_TRANSFER_OP = 0x0f8a7ea5;
const NFT_TRANSFER_OP = 0x5fcc3d14;

/** What the client needs to send through the Battery relay on behalf of the source wallet. */
export interface MigrationBatteryAccess {
    /** Address-keyed Battery config: no multichain wallet-id headers, so it hits the source's own balance. */
    api: BatteryConfiguration;
    /** TonProof token of the source wallet. */
    authToken: string;
}

/**
 * Battery recovers the unspent gas of the transactions it sponsors through
 * `excess_account`, so the jetton / NFT transfers of a sponsored transaction
 * must return their excess there instead of to the source. Mirrors iOS
 * `TransferPayloadExcessAddressRewriter`; self-paid transactions are left
 * untouched.
 */
export function withBatteryExcess(
    transaction: MigrationTransaction,
    excessAccount: string
): MigrationTransaction {
    if (!transaction.sponsored) {
        return transaction;
    }
    const excess = Address.parse(excessAccount);
    return {
        ...transaction,
        messages: transaction.messages.map(message => {
            const rewritten = rewriteExcess(Cell.fromBase64(message.boc), excess);
            return rewritten ? { ...message, boc: rewritten.toBoc().toString('base64') } : message;
        })
    };
}

/** `undefined` when the message is not a jetton / NFT transfer. */
function rewriteExcess(messageCell: Cell, excess: Address): Cell | undefined {
    const message = loadMessageRelaxed(messageCell.beginParse());
    const body = message.body.beginParse();
    if (body.remainingBits < 32) {
        return undefined;
    }
    const op = body.loadUint(32);
    if (op !== JETTON_TRANSFER_OP && op !== NFT_TRANSFER_OP) {
        return undefined;
    }

    const rewritten = beginCell().storeUint(op, 32).storeUint(body.loadUintBig(64), 64);
    if (op === JETTON_TRANSFER_OP) {
        rewritten.storeCoins(body.loadCoins());
    }
    rewritten.storeAddress(body.loadAddress());
    body.loadMaybeAddress();
    rewritten.storeAddress(excess).storeSlice(body);

    return beginCell()
        .store(storeMessageRelaxed({ ...message, body: rewritten.endCell() }))
        .endCell();
}

const BATTERY_IDLE_INITIAL_DELAY_MS = 1000;
const BATTERY_IDLE_POLL_INTERVAL_MS = 1500;
const BATTERY_IDLE_TIMEOUT_MS = 60_000;

/**
 * The relay accepts one in-flight sponsored message per wallet, so the next
 * sponsored send waits for `GET /status` to report no pending transactions.
 * `false` means the deadline passed; a failed status read is swallowed so a
 * transient error cannot abandon a partly broadcast batch.
 */
export async function waitForBatteryIdle(battery: MigrationBatteryAccess): Promise<boolean> {
    const api = new DefaultApi(battery.api);
    const deadline = Date.now() + BATTERY_IDLE_TIMEOUT_MS;
    let nextDelay = BATTERY_IDLE_INITIAL_DELAY_MS;

    while (Date.now() < deadline) {
        await delay(nextDelay);
        nextDelay = BATTERY_IDLE_POLL_INTERVAL_MS;
        try {
            const status = await api.getStatus({ xTonConnectAuth: battery.authToken });
            if (status.pendingTransactions.length === 0) {
                return true;
            }
        } catch {
            continue;
        }
    }
    return false;
}
