import { FuseV1Options, FuseVersion } from '@electron/fuses';
import path from 'path';

export const electronFuses = {
    version: FuseVersion.V1,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true
} as const;

const SENTINEL = Buffer.from('dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX');
const FUSE_ENABLED = 0x31;
const FUSE_DISABLED = 0x30;

const expectedFuses = Object.entries(electronFuses)
    .filter(([key]) => key !== 'version')
    .map(([key, enabled]) => ({ index: Number(key), enabled: enabled as boolean }));

export function fuseBinaryPath(outputPath: string, platform: string, executableName: string) {
    if (platform === 'darwin' || platform === 'mas') {
        return path.join(
            outputPath,
            `${executableName}.app`,
            'Contents',
            'Frameworks',
            'Electron Framework.framework',
            'Electron Framework'
        );
    }
    if (platform === 'win32') {
        return path.join(outputPath, `${executableName}.exe`);
    }
    return path.join(outputPath, executableName);
}

/**
 * Lists every fuse whose packaged state differs from `electronFuses`. A
 * universal macOS binary carries one fuse wire per architecture slice, and
 * each is checked.
 */
export function fuseMismatches(binary: Buffer): string[] {
    const mismatches: string[] = [];
    let sentinel = binary.indexOf(SENTINEL);
    if (sentinel === -1) {
        return ['fuse wire not found'];
    }

    while (sentinel !== -1) {
        const wire = sentinel + SENTINEL.length;
        const version = binary[wire];
        const length = binary[wire + 1];

        if (String(version) !== FuseVersion.V1) {
            mismatches.push(`unexpected fuse wire version ${version}`);
        } else {
            for (const { index, enabled } of expectedFuses) {
                const state = index < length ? binary[wire + 2 + index] : undefined;
                if (state !== (enabled ? FUSE_ENABLED : FUSE_DISABLED)) {
                    mismatches.push(`${FuseV1Options[index]} is not ${enabled ? 'on' : 'off'}`);
                }
            }
        }

        sentinel = binary.indexOf(SENTINEL, wire);
    }

    return mismatches;
}
