/* eslint-disable import/no-extraneous-dependencies */
import { Cell, toNano } from '@ton/core';
import { describe, expect, it } from 'vitest';

import { APIConfig } from '../../../../entries/apis';
import { PoolImplementationType } from '../../../../tonApiV2';
import {
    StakingEncoder,
    stakeBalanceReserveTon,
    stakeTemporaryReserveTon,
    unstakeRequiredBalanceTon,
    unstakeTemporaryReserveTon
} from '../staking-encoder';

const WALLET = '0:' + '1'.repeat(64);
const POOL = '0:' + '2'.repeat(64);

const encoder = new StakingEncoder({} as APIConfig, WALLET);

const deposit = (implementation: PoolImplementationType, amount = toNano('10')) => {
    const payload = encoder.encodeDeposit({ poolAddress: POOL, amount, implementation });
    const message = payload.messages[0];
    return {
        value: BigInt(message.amount),
        body: Cell.fromBase64(message.payload ?? '').beginParse()
    };
};

describe('StakingEncoder.encodeDeposit', () => {
    it('attaches the temporary reserve on top of a Tonstakers deposit', () => {
        const { value, body } = deposit(PoolImplementationType.LiquidTf);
        expect(value).toBe(toNano('10') + toNano('1'));
        expect(body.loadUint(32)).toBe(0x47d54391);
    });

    it('sends a Whales deposit with the whales op and no reserve', () => {
        const { value, body } = deposit(PoolImplementationType.Whales);
        expect(value).toBe(toNano('10'));
        expect(body.loadUint(32)).toBe(0x7bcd1fef);
        body.loadUintBig(64);
        expect(body.loadCoins()).toBe(toNano('0.1'));
    });

    it('sends a TF deposit as the "d" text comment with no reserve', () => {
        const { value, body } = deposit(PoolImplementationType.Tf);
        expect(value).toBe(toNano('10'));
        expect(body.loadUint(32)).toBe(0);
        expect(body.loadStringTail()).toBe('d');
    });
});

describe('staking reserves', () => {
    it('holds a temporary reserve only for Tonstakers', () => {
        expect(stakeTemporaryReserveTon(PoolImplementationType.LiquidTf)).toBe(1);
        expect(unstakeTemporaryReserveTon(PoolImplementationType.LiquidTf)).toBe(1);
        for (const implementation of [PoolImplementationType.Whales, PoolImplementationType.Tf]) {
            expect(stakeTemporaryReserveTon(implementation)).toBe(0);
            expect(unstakeTemporaryReserveTon(implementation)).toBe(0);
        }
    });

    it('keeps the full 1.1 out of MAX for Tonstakers and a gas reserve elsewhere', () => {
        expect(stakeBalanceReserveTon(PoolImplementationType.LiquidTf)).toBe(1.1);
        expect(stakeBalanceReserveTon(PoolImplementationType.Whales)).toBe(0.1);
        expect(stakeBalanceReserveTon(PoolImplementationType.Tf)).toBe(0.1);
    });

    it('covers the attached withdrawal value plus the network fee', () => {
        expect(unstakeRequiredBalanceTon(PoolImplementationType.LiquidTf)).toBe(1.1);
        expect(unstakeRequiredBalanceTon(PoolImplementationType.Tf)).toBe(1.1);
        expect(unstakeRequiredBalanceTon(PoolImplementationType.Whales)).toBe(0.3);
    });
});
