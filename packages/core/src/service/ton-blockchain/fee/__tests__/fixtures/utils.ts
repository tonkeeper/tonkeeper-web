import {
    beginCell,
    Cell,
    Message,
    Slice,
    loadMessage,
    storeMessageRelaxed,
    OutActionSendMsg
} from '@ton/core';
import { KeyPair, mnemonicToPrivateKey } from '@ton/crypto';
import { loadOutListExtendedV5R1 } from '@ton/ton/dist/wallets/v5r1/WalletV5R1Actions';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { assertUnreachable, TonWalletVersion, FeeBlockchainConfig } from '../../compat';
import { CellStats } from '../../fees';

export type FixtureTag =
    | 'simple-transfer'
    | 'deploy-transfer'
    | 'multi-transfer'
    | 'send-all'
    | 'jetton-transfer'
    | 'jetton-deploy-transfer'
    | 'dedup-within-msg'
    | 'dedup-cross-msg'
    | 'library-body'
    | 'add-extension'
    | 'remove-extension';

export type WalletFeeTestCase = {
    name: string;
    tag: FixtureTag;
    txHash: string;
    input: {
        inMsgBoc: string; // base64 encoded BOC
        walletVersion: TonWalletVersion;
        storageUsed: CellStats;
        timeDelta: bigint;
        existingExtensions?: string[]; // only for extension tests
    };
    expected: {
        gasUsed: bigint;
        gasFee: bigint;
        actionFee: bigint;
        storageFee: bigint;
        importFee: bigint;
        fwdFeeRemaining: bigint;
        walletFee: bigint;
    };
    blockchainConfig: FeeBlockchainConfig;
};

export function normalizeHash(message: Message, normalizeExternal: boolean): Buffer {
    if (!normalizeExternal || message.info.type !== 'external-in') {
        return message.body.hash();
    }

    const cell = beginCell()
        .storeUint(2, 2) // external-in
        .storeUint(0, 2) // addr_none
        .storeAddress(message.info.dest)
        .storeUint(0, 4) // import_fee = 0
        .storeBit(false) // no StateInit
        .storeBit(true) // body as reference
        .storeRef(message.body)
        .endCell();

    return cell.hash();
}

/**
 * Replace dummy signature in wallet message body.
 * V3/V4: signature at start (first 512 bits)
 * V5: signature at end (last 512 bits)
 */
export function replaceSignature(
    dummyBody: Cell,
    realSignature: Buffer,
    version: TonWalletVersion
): Cell {
    const slice = dummyBody.beginParse();
    const builder = beginCell();

    if (version === TonWalletVersion.V5R1) {
        // V5: signing message + signature (signature at end)
        const totalBits = slice.remainingBits;
        const signingBits = totalBits - 512;
        builder.storeBits(slice.loadBits(signingBits));
        while (slice.remainingRefs > 0) {
            builder.storeRef(slice.loadRef());
        }
        builder.storeBuffer(realSignature);
    } else if (
        version === TonWalletVersion.V4R2 ||
        version === TonWalletVersion.V3R2 ||
        version === TonWalletVersion.V3R1
    ) {
        // V3/V4: signature + signing message (signature at start)
        slice.skip(512);
        builder.storeBuffer(realSignature);
        builder.storeBits(slice.loadBits(slice.remainingBits));
        while (slice.remainingRefs > 0) {
            builder.storeRef(slice.loadRef());
        }
    } else {
        assertUnreachable(version);
    }

    return builder.endCell();
}

/**
 * Parse V5R1 wallet body and extract out messages.
 * Structure: opcode(32) | wallet_id(32) | timeout(32) | seqno(32) | out_list_extended | signature(512)
 */
function parseV5R1OutMsgs(bodySlice: Slice): Cell[] {
    const opcode = bodySlice.loadUint(32);

    // 0x7369676e = "sign" (external signed)
    // 0x73696e74 = "sint" (internal signed)
    if (opcode !== 0x7369676e && opcode !== 0x73696e74) {
        return [];
    }

    bodySlice.loadUint(32); // wallet_id
    bodySlice.loadUint(32); // timeout (valid_until)
    bodySlice.loadUint(32); // seqno

    // Use @ton/ton to parse out_list_extended
    const actions = loadOutListExtendedV5R1(bodySlice) as (OutActionSendMsg | { type: string })[];

    // Filter sendMsg actions and serialize back to Cell
    return actions
        .filter((a): a is OutActionSendMsg => a.type === 'sendMsg')
        .map(a => beginCell().store(storeMessageRelaxed(a.outMsg)).endCell());
}

/**
 * Parse V3/V4 wallet body and extract out messages.
 * V3: signature(512) | wallet_id(32) | timeout(32) | seqno(32) | [mode(8) | ^message]+
 * V4: signature(512) | wallet_id(32) | timeout(32) | seqno(32) | op(32)? | [mode(8) | ^message]+
 */
function parseV3V4OutMsgs(bodySlice: Slice): Cell[] {
    bodySlice.skip(512); // signature
    bodySlice.loadUint(32); // wallet_id
    bodySlice.loadUint(32); // timeout (valid_until)
    bodySlice.loadUint(32); // seqno

    // Messages stored inline: [mode(8) | ^message]+
    const outMsgs: Cell[] = [];
    while (bodySlice.remainingRefs > 0 && bodySlice.remainingBits >= 8) {
        bodySlice.loadUint(8); // send_mode
        outMsgs.push(bodySlice.loadRef());
    }
    return outMsgs;
}

/**
 * Parse wallet external message and extract out messages as Cell[].
 * Uses @ton/core and @ton/ton for proper TL-B parsing.
 */
export function parseWalletOutMsgCells(inMsg: Cell, version: TonWalletVersion): Cell[] {
    const message = loadMessage(inMsg.beginParse());
    const bodySlice = message.body.beginParse();

    if (version === TonWalletVersion.V5R1) {
        return parseV5R1OutMsgs(bodySlice);
    }

    if (
        version === TonWalletVersion.V4R2 ||
        version === TonWalletVersion.V3R2 ||
        version === TonWalletVersion.V3R1
    ) {
        return parseV3V4OutMsgs(bodySlice);
    }

    assertUnreachable(version);
}

export async function loadMnemonicKeyPair(): Promise<KeyPair> {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const envPath = join(__dirname, '..', '.env');

    if (!existsSync(envPath)) {
        throw new Error('.env file not found. Create it with TON_MNEMONIC.');
    }

    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const match = trimmed.match(/^TON_MNEMONIC=(.*)$/);
        if (match) {
            let value = match[1].trim();
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }

            const mnemonic = value.split(' ');

            if (mnemonic.length !== 24) {
                throw new Error('TON_MNEMONIC must be 24 words');
            }

            const keyPair = await mnemonicToPrivateKey(mnemonic);

            return keyPair;
        }
    }

    throw new Error('TON_MNEMONIC not found in .env');
}
