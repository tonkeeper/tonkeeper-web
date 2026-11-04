/* eslint-disable import/no-extraneous-dependencies */
import {
    Address,
    beginCell,
    Cell,
    internal,
    loadMessage,
    storeMessageRelaxed,
    storeStateInit
} from '@ton/core';
import { describe, expect, it } from 'vitest';

import { CellSigner } from '../../entries/signer';
import { TonWalletStandard, WalletVersion } from '../../entries/wallet';
import { MessageConsequences } from '../../tonApiV2';
import { MigrationTransaction } from '../migration/migrationApi';
import { signMigrationTransaction } from '../migration/migrationSigner';
import {
    MigrationVerificationContext,
    MigrationVerificationError
} from '../migration/migrationVerifier';
import { walletContractFromState } from '../wallet/contractService';

const SIGNATURE = Buffer.alloc(64, 7);
const DESTINATION = '0:' + 'd'.repeat(64);
const ATTACKER = '0:' + 'e'.repeat(64);

const CONTEXT: MigrationVerificationContext = {
    source: Address.parse('0:' + 'c'.repeat(64)),
    destination: Address.parse(DESTINATION),
    jettonWallets: new Map(),
    nfts: new Map()
};

function makeSigner(): { signer: CellSigner; signed: Cell[] } {
    const signed: Cell[] = [];
    const signer = Object.assign(
        async (cell: Cell) => {
            signed.push(cell);
            return SIGNATURE;
        },
        { type: 'cell' as const }
    );
    return { signer, signed };
}

function makeWallet(version: WalletVersion): TonWalletStandard {
    return {
        id: '0:' + 'c'.repeat(64),
        rawAddress: '0:' + 'c'.repeat(64),
        publicKey: '5754865e86d0ade1199301bbb0319a25ed6b129c4b0a57f28f62449b3df9c522',
        version
    };
}

function messageCell(to = DESTINATION): Cell {
    return beginCell()
        .store(storeMessageRelaxed(internal({ to, value: 1000000000n, bounce: true })))
        .endCell();
}

function messageBoc(to = DESTINATION): string {
    return messageCell(to).toBoc().toString('base64');
}

function v4Body(seqno: number, ...messages: Cell[]): Cell {
    const body = beginCell()
        .storeUint(698983191, 32)
        .storeUint(1755000000, 32)
        .storeUint(seqno, 32)
        .storeUint(0, 8);
    for (const message of messages) {
        body.storeUint(3, 8).storeRef(message);
    }
    return body.endCell();
}

function reencodedMessageCell(boc: string): Cell {
    return Cell.fromBase64(boc);
}

function makeTransaction(partial: Partial<MigrationTransaction>): MigrationTransaction {
    return {
        seqno: 42,
        boc: '',
        messages: [],
        emulation: {} as MessageConsequences,
        gasSpent: '0',
        sponsored: false,
        ...partial
    };
}

describe('signMigrationTransaction', () => {
    it('rebuilds a v4 body from messages, prepends the signature and wraps external', async () => {
        const preparedBody = beginCell()
            .storeUint(698983191, 32) // wallet id
            .storeUint(1755000000, 32) // valid until
            .storeUint(7, 32) // backend-baked seqno, replaced by transaction.seqno
            .storeUint(0, 8) // order
            .endCell();
        const msg = messageBoc();
        const wallet = makeWallet(WalletVersion.V4R2);
        const { signer, signed } = makeSigner();

        const externalCell = await signMigrationTransaction({
            transaction: makeTransaction({
                seqno: 42,
                boc: preparedBody.toBoc().toString('base64'),
                messages: [{ boc: msg, mode: 3 }]
            }),
            wallet,
            signer,
            context: CONTEXT
        });

        const expectedUnsigned = beginCell()
            .storeUint(698983191, 32)
            .storeUint(1755000000, 32)
            .storeUint(42, 32)
            .storeUint(0, 8)
            .storeUint(3, 8)
            .storeRef(reencodedMessageCell(msg))
            .endCell();
        expect(signed).toHaveLength(1);
        expect(signed[0].equals(expectedUnsigned)).toBe(true);

        const message = loadMessage(externalCell.beginParse());
        if (message.info.type !== 'external-in') {
            throw new Error('Expected an external-in message');
        }
        expect(message.info.dest.toRawString()).toBe(wallet.rawAddress);
        expect(message.init).toBeNull();

        const body = message.body.beginParse();
        expect(body.loadBuffer(64).equals(SIGNATURE)).toBe(true);
        const rest = body.asCell();
        expect(rest.equals(expectedUnsigned)).toBe(true);
    });

    it('rebuilds a v3 body without the order byte', async () => {
        const preparedBody = beginCell()
            .storeUint(698983191, 32)
            .storeUint(1755000000, 32)
            .storeUint(7, 32)
            .endCell();
        const msg = messageBoc();
        const { signer, signed } = makeSigner();

        await signMigrationTransaction({
            transaction: makeTransaction({
                seqno: 5,
                boc: preparedBody.toBoc().toString('base64'),
                messages: [{ boc: msg, mode: 130 }]
            }),
            wallet: makeWallet(WalletVersion.V3R2),
            signer,
            context: CONTEXT
        });

        const expectedUnsigned = beginCell()
            .storeUint(698983191, 32)
            .storeUint(1755000000, 32)
            .storeUint(5, 32)
            .storeUint(130, 8)
            .storeRef(reencodedMessageCell(msg))
            .endCell();
        expect(signed[0].equals(expectedUnsigned)).toBe(true);
    });

    it('rebuilds a v5r1 body with the out list, appends the signature at the tail', async () => {
        const opcode = 0x7369676e;
        const walletId = -239; // int32 — sign must round-trip
        const validUntil = 1755000000;
        const preparedBody = beginCell()
            .storeUint(opcode, 32)
            .storeInt(walletId, 32)
            .storeUint(validUntil, 32)
            .storeUint(7, 32)
            .endCell();
        const msg = messageBoc();
        const wallet = makeWallet(WalletVersion.V5R1);
        const { signer, signed } = makeSigner();

        const externalCell = await signMigrationTransaction({
            transaction: makeTransaction({
                seqno: 9,
                boc: preparedBody.toBoc().toString('base64'),
                messages: [{ boc: msg, mode: 3 }]
            }),
            wallet,
            signer,
            context: CONTEXT
        });

        const unsigned = signed[0].beginParse();
        expect(unsigned.loadUint(32)).toBe(opcode);
        expect(unsigned.loadInt(32)).toBe(walletId);
        expect(unsigned.loadUint(32)).toBe(validUntil);
        expect(unsigned.loadUint(32)).toBe(9);
        expect(unsigned.loadBit()).toBe(true); // maybe-ref: out list present
        const outList = unsigned.loadRef().beginParse();
        expect(unsigned.loadBit()).toBe(false); // no extended actions
        expect(outList.loadUint(32)).toBe(0x0ec3c86d);
        expect(outList.loadUint(8)).toBe(3 | 2); // ignore-errors bit forced on
        expect(outList.loadRef().bits.length).toBe(0); // previous (empty) list
        expect(outList.loadRef().equals(reencodedMessageCell(msg))).toBe(true);

        const body = loadMessage(externalCell.beginParse()).body.beginParse();
        body.skip(body.remainingBits - 512);
        expect(body.loadBuffer(64).equals(SIGNATURE)).toBe(true);
    });

    it('rebuilds a v5beta body with a plain ref out list', async () => {
        const preparedBody = beginCell()
            .storeUint(0x7369676e, 32)
            .storeInt(1234, 32)
            .storeUint(1755000000, 32)
            .storeUint(7, 32)
            .endCell();
        const msg = messageBoc();
        const { signer, signed } = makeSigner();

        await signMigrationTransaction({
            transaction: makeTransaction({
                seqno: 3,
                boc: preparedBody.toBoc().toString('base64'),
                messages: [{ boc: msg, mode: 3 }]
            }),
            wallet: makeWallet(WalletVersion.V5_BETA),
            signer,
            context: CONTEXT
        });

        const unsigned = signed[0].beginParse();
        unsigned.skip(32 + 32 + 32 + 32);
        expect(unsigned.loadBit()).toBe(false); // no extensions flag first
        const outList = unsigned.loadRef().beginParse();
        expect(outList.loadUint(32)).toBe(0x0ec3c86d);
    });

    it('refuses to sign a transaction without messages', async () => {
        const { signer, signed } = makeSigner();

        const error = await signMigrationTransaction({
            transaction: makeTransaction({
                boc: v4Body(7, messageCell()).toBoc().toString('base64'),
                messages: []
            }),
            wallet: makeWallet(WalletVersion.V4R2),
            signer,
            context: CONTEXT
        }).catch(e => e);

        expect(error).toBeInstanceOf(MigrationVerificationError);
        expect(signed).toHaveLength(0);
    });

    it('refuses to sign messages paying another address', async () => {
        const { signer, signed } = makeSigner();

        const error = await signMigrationTransaction({
            transaction: makeTransaction({
                boc: v4Body(7).toBoc().toString('base64'),
                messages: [
                    { boc: messageBoc(), mode: 3 },
                    { boc: messageBoc(ATTACKER), mode: 3 }
                ]
            }),
            wallet: makeWallet(WalletVersion.V4R2),
            signer,
            context: CONTEXT
        }).catch(e => e);

        expect(error).toBeInstanceOf(MigrationVerificationError);
        expect(signed).toHaveLength(0);
    });

    it('attaches the backend state init when provided', async () => {
        const wallet = makeWallet(WalletVersion.V4R2);
        const init = walletContractFromState(wallet).init;
        const stateInitBoc = beginCell()
            .store(storeStateInit(init))
            .endCell()
            .toBoc()
            .toString('base64');
        const { signer } = makeSigner();

        const externalCell = await signMigrationTransaction({
            transaction: makeTransaction({
                seqno: 0,
                boc: v4Body(0).toBoc().toString('base64'),
                messages: [{ boc: messageBoc(), mode: 3 }],
                stateInit: stateInitBoc
            }),
            wallet,
            signer,
            context: CONTEXT
        });

        const message = loadMessage(externalCell.beginParse());
        expect(message.init?.code?.equals(init.code!)).toBe(true);
        expect(message.init?.data?.equals(init.data!)).toBe(true);
    });

    it('falls back to the wallet contract state init at seqno 0', async () => {
        const wallet = makeWallet(WalletVersion.V4R2);
        const { signer } = makeSigner();

        const externalCell = await signMigrationTransaction({
            transaction: makeTransaction({
                seqno: 0,
                boc: v4Body(0).toBoc().toString('base64'),
                messages: [{ boc: messageBoc(), mode: 3 }]
            }),
            wallet,
            signer,
            context: CONTEXT
        });

        const message = loadMessage(externalCell.beginParse());
        const expectedInit = walletContractFromState(wallet).init;
        expect(message.init?.code?.equals(expectedInit.code!)).toBe(true);
        expect(message.init?.data?.equals(expectedInit.data!)).toBe(true);
    });
});
