/* eslint-disable import/no-extraneous-dependencies */
import {
    Address,
    beginCell,
    Cell,
    internal,
    loadMessageRelaxed,
    storeMessageRelaxed
} from '@ton/core';
import { describe, expect, it } from 'vitest';

import { MessageConsequences } from '../../tonApiV2';
import { MigrationTransaction } from '../migration/migrationApi';
import { withBatteryExcess } from '../migration/migrationBattery';

const SOURCE = '0:' + 'c'.repeat(64);
const DESTINATION = '0:' + 'd'.repeat(64);
const JETTON_WALLET = '0:' + '1'.repeat(64);
const NFT_ITEM = '0:' + '5'.repeat(64);
const EXCESS = '0:' + '9'.repeat(64);

const forwardPayload = beginCell().storeUint(0, 32).storeStringTail('hello').endCell();

function jettonTransferBody(): Cell {
    return beginCell()
        .storeUint(0x0f8a7ea5, 32)
        .storeUint(17, 64)
        .storeCoins(1000n)
        .storeAddress(Address.parse(DESTINATION))
        .storeAddress(Address.parse(SOURCE))
        .storeBit(0)
        .storeCoins(1n)
        .storeBit(1)
        .storeRef(forwardPayload)
        .endCell();
}

function nftTransferBody(): Cell {
    return beginCell()
        .storeUint(0x5fcc3d14, 32)
        .storeUint(18, 64)
        .storeAddress(Address.parse(DESTINATION))
        .storeAddress(Address.parse(SOURCE))
        .storeBit(0)
        .storeCoins(1n)
        .storeBit(0)
        .endCell();
}

function messageBoc(to: string, body?: Cell): string {
    return beginCell()
        .store(storeMessageRelaxed(internal({ to, value: 50_000_000n, bounce: true, body })))
        .endCell()
        .toBoc()
        .toString('base64');
}

function transaction(sponsored: boolean, ...bocs: string[]): MigrationTransaction {
    return {
        seqno: 1,
        boc: '',
        messages: bocs.map(boc => ({ boc, mode: 3 })),
        emulation: {} as MessageConsequences,
        gasSpent: '0',
        sponsored
    };
}

function bodyOf(boc: string) {
    return loadMessageRelaxed(Cell.fromBase64(boc).beginParse()).body.beginParse();
}

describe('withBatteryExcess', () => {
    it('points a sponsored jetton transfer excess at the Battery account', () => {
        const [message] = withBatteryExcess(
            transaction(true, messageBoc(JETTON_WALLET, jettonTransferBody())),
            EXCESS
        ).messages;

        const body = bodyOf(message.boc);
        expect(body.loadUint(32)).toBe(0x0f8a7ea5);
        expect(body.loadUintBig(64)).toBe(17n);
        expect(body.loadCoins()).toBe(1000n);
        expect(body.loadAddress().toRawString()).toBe(DESTINATION);
        expect(body.loadAddress().toRawString()).toBe(EXCESS);
        expect(body.loadBit()).toBe(false);
        expect(body.loadCoins()).toBe(1n);
        expect(body.loadBit()).toBe(true);
        expect(body.loadRef().equals(forwardPayload)).toBe(true);
        expect(message.mode).toBe(3);
    });

    it('points a sponsored NFT transfer excess at the Battery account', () => {
        const [message] = withBatteryExcess(
            transaction(true, messageBoc(NFT_ITEM, nftTransferBody())),
            EXCESS
        ).messages;

        const body = bodyOf(message.boc);
        body.skip(32 + 64);
        expect(body.loadAddress().toRawString()).toBe(DESTINATION);
        expect(body.loadAddress().toRawString()).toBe(EXCESS);
    });

    it('leaves plain transfers and self-paid transactions untouched', () => {
        const plain = messageBoc(DESTINATION);
        const jetton = messageBoc(JETTON_WALLET, jettonTransferBody());

        expect(withBatteryExcess(transaction(true, plain), EXCESS).messages[0].boc).toBe(plain);
        expect(withBatteryExcess(transaction(false, jetton), EXCESS).messages[0].boc).toBe(jetton);
    });
});
