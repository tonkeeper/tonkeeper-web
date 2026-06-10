/* eslint-disable import/no-extraneous-dependencies */
import { Address } from '@ton/core';
import { describe, expect, it } from 'vitest';
import { formatTransferUrl } from '../url';

const FRIENDLY = 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N';
const JETTON = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

describe('formatTransferUrl', () => {
    it('returns a bare ton://transfer URL when no params are supplied', () => {
        expect(formatTransferUrl({ address: FRIENDLY })).toBe(`ton://transfer/${FRIENDLY}`);
    });

    it('appends amount, text and jetton in that order', () => {
        expect(
            formatTransferUrl({
                address: FRIENDLY,
                amount: '1000000000',
                text: 'hello world',
                jetton: JETTON
            })
        ).toBe(
            `ton://transfer/${FRIENDLY}?amount=1000000000&text=hello%20world&jetton=${Address.parse(
                JETTON
            ).toString()}`
        );
    });

    it('URI-encodes comment text', () => {
        expect(formatTransferUrl({ address: FRIENDLY, text: 'a&b=c d' })).toBe(
            `ton://transfer/${FRIENDLY}?text=a%26b%3Dc%20d`
        );
    });

    it('normalises the jetton address to its default friendly form', () => {
        expect(formatTransferUrl({ address: FRIENDLY, jetton: JETTON })).toBe(
            `ton://transfer/${FRIENDLY}?jetton=${Address.parse(JETTON).toString()}`
        );
    });
});
