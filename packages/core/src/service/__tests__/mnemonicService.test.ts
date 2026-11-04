/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import { parseMnemonicPaste } from '../mnemonicService';

/**
 * Tests for `parseMnemonicPaste` — the clipboard normaliser for the
 * import-words form. Pure string transform; no async setup needed.
 *
 * Each block models a real shape we've seen pasted out of another
 * wallet: numbered lists, comma-separated, newline-separated, NBSP
 * spacers, and so on. The behavioural contract is "any non-letter run
 * is a separator", which is what every concrete case below verifies.
 */
describe('parseMnemonicPaste', () => {
    const CANONICAL_12 =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    it('passes through a clean space-separated phrase', () => {
        const words = parseMnemonicPaste(CANONICAL_12);
        expect(words).toEqual(CANONICAL_12.split(' '));
        expect(words).toHaveLength(12);
    });

    it('strips numbered-list prefixes with dots ("1. word")', () => {
        const input = '1. abandon 2. abandon 3. abandon 4. about';
        expect(parseMnemonicPaste(input)).toEqual(['abandon', 'abandon', 'abandon', 'about']);
    });

    it('strips numbered-list prefixes with parens ("1) word")', () => {
        const input = '1) abandon 2) abandon 3) about';
        expect(parseMnemonicPaste(input)).toEqual(['abandon', 'abandon', 'about']);
    });

    it('strips numbered-list prefixes with hash ("#1 word")', () => {
        const input = '#1 abandon #2 abandon #3 about';
        expect(parseMnemonicPaste(input)).toEqual(['abandon', 'abandon', 'about']);
    });

    it('handles digits glued to words ("word1 word2")', () => {
        // Some wallets export `word11 word12` style (word + position
        // suffix). The "non-letter run" rule still recovers the words.
        const input = 'abandon11 abandon12 about13';
        expect(parseMnemonicPaste(input)).toEqual(['abandon', 'abandon', 'about']);
    });

    it('treats commas as separators', () => {
        expect(parseMnemonicPaste('abandon, abandon, about')).toEqual([
            'abandon',
            'abandon',
            'about'
        ]);
        // No space after the comma.
        expect(parseMnemonicPaste('abandon,abandon,about')).toEqual([
            'abandon',
            'abandon',
            'about'
        ]);
    });

    it('treats semicolons as separators', () => {
        expect(parseMnemonicPaste('abandon; abandon; about')).toEqual([
            'abandon',
            'abandon',
            'about'
        ]);
    });

    it('treats newlines as separators (multi-line paste from a printout)', () => {
        const input = '1. abandon\n2. abandon\n3. about';
        expect(parseMnemonicPaste(input)).toEqual(['abandon', 'abandon', 'about']);
    });

    it('treats tabs as separators', () => {
        expect(parseMnemonicPaste('abandon\tabandon\tabout')).toEqual([
            'abandon',
            'abandon',
            'about'
        ]);
    });

    it('treats non-breaking spaces (\\u00A0) as separators', () => {
        expect(parseMnemonicPaste('abandon abandon about')).toEqual([
            'abandon',
            'abandon',
            'about'
        ]);
    });

    it('lowercases ALL-CAPS and Title Case phrases', () => {
        expect(parseMnemonicPaste('ABANDON Abandon ABOUT')).toEqual([
            'abandon',
            'abandon',
            'about'
        ]);
    });

    it('collapses runs of multiple separators', () => {
        expect(parseMnemonicPaste('abandon   ,,,   abandon   ;;;   about')).toEqual([
            'abandon',
            'abandon',
            'about'
        ]);
    });

    it('trims leading and trailing punctuation / whitespace', () => {
        expect(parseMnemonicPaste('  1. abandon abandon about.  ')).toEqual([
            'abandon',
            'abandon',
            'about'
        ]);
    });

    it('returns an empty array for empty or whitespace-only input', () => {
        expect(parseMnemonicPaste('')).toEqual([]);
        expect(parseMnemonicPaste('   ')).toEqual([]);
        expect(parseMnemonicPaste('\n\t  \n')).toEqual([]);
    });

    it('returns an empty array when no letters are present', () => {
        // The form's validation step will surface the error to the user;
        // the parser just promises to not crash and to not invent words.
        expect(parseMnemonicPaste('123 456 789')).toEqual([]);
        expect(parseMnemonicPaste('!@#$%^&*()')).toEqual([]);
    });

    it('preserves order across all separator styles in one input', () => {
        const messy = '1.\tABANDON,\n2. abandon;  #3 ABOUT.';
        expect(parseMnemonicPaste(messy)).toEqual(['abandon', 'abandon', 'about']);
    });

    it('does not validate against the BIP39 wordlist', () => {
        // Garbage-but-letter input still parses to tokens — the layer
        // above is responsible for wordlist validation.
        expect(parseMnemonicPaste('foo bar baz')).toEqual(['foo', 'bar', 'baz']);
    });
});
