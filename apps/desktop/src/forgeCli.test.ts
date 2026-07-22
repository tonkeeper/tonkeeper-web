import { describe, expect, it } from 'vitest';

import { getRequestedArchitecture } from './forgeCli';

describe('getRequestedArchitecture', () => {
    it.each([
        ['--arch=x64', ['node', 'electron-forge', 'publish', '--arch=x64']],
        ['--arch x64', ['node', 'electron-forge', 'publish', '--arch', 'x64']],
        ['-a x64', ['node', 'electron-forge', 'publish', '-a', 'x64']]
    ])('parses x64 from %s', (_name, argv) => {
        expect(getRequestedArchitecture(argv)).toBe('x64');
    });

    it('parses arm64', () => {
        expect(
            getRequestedArchitecture(['node', 'electron-forge', 'publish', '--arch=arm64'])
        ).toBe('arm64');
    });

    it('returns undefined when the architecture is missing', () => {
        expect(
            getRequestedArchitecture(['node', 'electron-forge', 'publish', '--arch'])
        ).toBeUndefined();
    });

    it('ignores unrelated arguments', () => {
        expect(
            getRequestedArchitecture(['node', 'electron-forge', 'publish', '--platform=linux'])
        ).toBeUndefined();
    });
});
