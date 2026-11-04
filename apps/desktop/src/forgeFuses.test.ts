import path from 'path';
import { describe, expect, it } from 'vitest';
import { FuseV1Options } from '@electron/fuses';
import { fuseBinaryPath, fuseMismatches } from './forgeFuses';

const SENTINEL = 'dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX';
const ON = '1';
const OFF = '0';

const wire = (states: Partial<Record<FuseV1Options, string>>, length = 8) => {
    const fuses = Array.from({ length }, (_, index) => states[index as FuseV1Options] ?? OFF);
    return Buffer.concat([
        Buffer.from(SENTINEL),
        Buffer.from([1, length]),
        Buffer.from(fuses.join(''))
    ]);
};

const configured = () =>
    wire({
        [FuseV1Options.RunAsNode]: OFF,
        [FuseV1Options.EnableCookieEncryption]: OFF,
        [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: OFF,
        [FuseV1Options.EnableNodeCliInspectArguments]: OFF,
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: ON,
        [FuseV1Options.OnlyLoadAppFromAsar]: ON
    });

const electronDefaults = () =>
    wire({
        [FuseV1Options.RunAsNode]: ON,
        [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: ON,
        [FuseV1Options.EnableNodeCliInspectArguments]: ON,
        [FuseV1Options.GrantFileProtocolExtraPrivileges]: ON
    });

describe('fuseMismatches', () => {
    it('accepts a binary with the configured fuses', () => {
        const binary = Buffer.concat([Buffer.from('header'), configured(), Buffer.from('tail')]);
        expect(fuseMismatches(binary)).toEqual([]);
    });

    it('reports every fuse left at the Electron default', () => {
        expect(fuseMismatches(electronDefaults())).toEqual([
            'RunAsNode is not off',
            'EnableNodeOptionsEnvironmentVariable is not off',
            'EnableNodeCliInspectArguments is not off',
            'EnableEmbeddedAsarIntegrityValidation is not on',
            'OnlyLoadAppFromAsar is not on'
        ]);
    });

    it('checks every slice of a universal binary', () => {
        const binary = Buffer.concat([configured(), Buffer.from('slice'), electronDefaults()]);
        expect(fuseMismatches(binary)).toContain('RunAsNode is not off');
    });

    it('reports a binary without a fuse wire', () => {
        expect(fuseMismatches(Buffer.from('not electron'))).toEqual(['fuse wire not found']);
    });

    it('reports a fuse wire too short for a configured fuse', () => {
        expect(fuseMismatches(wire({}, 4))).toContain('OnlyLoadAppFromAsar is not on');
    });
});

describe('fuseBinaryPath', () => {
    it('points at the Electron framework on macOS', () => {
        expect(fuseBinaryPath('out/app', 'darwin', 'Tonkeeper')).toBe(
            path.join(
                'out/app',
                'Tonkeeper.app',
                'Contents',
                'Frameworks',
                'Electron Framework.framework',
                'Electron Framework'
            )
        );
    });

    it('points at the executable on Windows and Linux', () => {
        expect(fuseBinaryPath('out/app', 'win32', 'Tonkeeper')).toBe(
            path.join('out/app', 'Tonkeeper.exe')
        );
        expect(fuseBinaryPath('out/app', 'linux', 'Tonkeeper')).toBe(
            path.join('out/app', 'Tonkeeper')
        );
    });
});
