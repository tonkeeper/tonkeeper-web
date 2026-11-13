import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import type MakerAppImageType from '@pengx17/electron-forge-maker-appimage';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { PublisherGithub } from '@electron-forge/publisher-github';
import type { ForgeConfig } from '@electron-forge/shared-types';
import type { NotaryToolCredentials } from '@electron/notarize/lib/types';
import path from 'path';

import { MakerDebConfigOptions } from '@electron-forge/maker-deb/dist/Config';
import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';
import { mainWindowName } from './src/constants';
import { getRequestedArchitecture } from './src/forgeCli';
import { electronFuses, fuseBinaryPath, fuseMismatches } from './src/forgeFuses';
import { resolveAppVersion } from '../../scripts/app-version';

const isDev = process.env.NODE_ENV === 'development';
const isPrerelease = process.env.GITHUB_REF_NAME?.includes('-') ?? false;
const githubToken = process.env.GITHUB_TOKEN;
const requestedArchitecture = getRequestedArchitecture(process.argv);
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const appName = 'Keeper';
// Squirrel.Windows starts the app through this file name from existing shortcuts and the deb/rpm
// packages install it as their bin. On macOS, Squirrel renames an installed bundle to
// <executableName>.app on update and then fails to relaunch it; the app moves itself to Keeper.app
// instead (src/electron/keeperBundle.ts).
const executableName = 'Tonkeeper';

// The AppImage carries libsecret so the keychain works on systems without it. See
// github.com/tonkeeper/tonkeeper-web/issues/374. Only the library itself goes in: its dependencies
// (glib, libgcrypt) come with every desktop Electron runs on, and the build host's copies would
// need the build host's glibc.
function appImageLibraries() {
    const libsecret = process.env.LIBSECRET_PATH || '/usr/lib/x86_64-linux-gnu/libsecret-1.so.0';
    if (existsSync(libsecret)) return [libsecret];
    if (isCI) throw new Error(`${libsecret} not found`);
    console.warn(`[AppImage] ${libsecret} not found, building without it`);
    return [];
}

// Flipping fuses and writing the asar integrity hash invalidate Electron's
// stock ad-hoc signature. osxSign only re-signs when a Developer ID identity
// is available, so local builds would be killed at launch without this.
function restoreAdHocSignature(appPath: string) {
    if (spawnSync('codesign', ['--verify', '--deep', '--strict', appPath]).status === 0) {
        return;
    }
    const sign = spawnSync('codesign', ['--sign', '-', '--force', '--deep', appPath], {
        stdio: 'inherit'
    });
    if (sign.status !== 0) throw new Error(`Ad-hoc signing ${appPath} failed`);
}

const schemes = ['tc', 'tonkeeper', 'tonkeeper-tc', 'wc'];
const squirrelRemoteReleases = githubToken
    ? {
          // SyncReleases uses the GitHub API for repo URLs, so keep PR/local builds offline.
          remoteReleases: 'https://github.com/tonkeeper/tonkeeper-web',
          remoteToken: githubToken
      }
    : {};

const devAndRpmOptions = {
    // Compatibility identifiers stay Tonkeeper so upgrades retain the existing
    // install and data. productName, genericName and description are display-only.
    name: 'Tonkeeper',
    productName: appName,
    genericName: 'Keeper',
    license: 'Apache-2.0',
    maintainer: 'Ton Apps Group',
    bin: 'Tonkeeper', // bin name
    description: 'Secure multichain crypto wallet',
    homepage: 'https://tonkeeper.com',
    icon: path.join(__dirname, 'public', 'icon.png'),
    mimeType: schemes.map(schema => `x-scheme-handler/${schema}`)
};

const osxNotarize =
    process.env.APPLE_API_KEY && process.env.APPLE_API_KEY_ID && process.env.APPLE_API_ISSUER
        ? ({
              appleApiKey: process.env.APPLE_API_KEY,
              appleApiKeyId: process.env.APPLE_API_KEY_ID,
              appleApiIssuer: process.env.APPLE_API_ISSUER
          } as NotaryToolCredentials)
        : undefined;

// The AppImage maker is yarn-patched (.yarn/patches) to build through app-builder-lib 26, which no
// longer ships the app-builder binary the published maker calls, and to bundle `libraries`.
const linuxAppImageMakers = () => {
    if (process.platform !== 'linux' || requestedArchitecture !== 'x64') {
        return [];
    }

    const MakerAppImage: typeof MakerAppImageType =
        require('@pengx17/electron-forge-maker-appimage').default;
    return [
        new MakerAppImage({ options: devAndRpmOptions, libraries: appImageLibraries() }, ['linux'])
    ];
};

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        icon: path.join(__dirname, 'public', 'icon'),
        name: appName,
        executableName,
        // Squirrel.Windows names the Start-menu and desktop shortcuts after ProductName. The update
        // hook removes the shortcuts with the old name (src/electron/squirrelEvents.ts).
        win32metadata: {
            FileDescription: appName,
            ProductName: appName,
            InternalName: 'Tonkeeper'
        },
        protocols: [
            {
                name: 'Keeper Protocol',
                schemes: schemes
            }
        ],
        appBundleId: 'com.tonapps.tonkeeperpro',
        osxSign: {
            optionsForFile: (optionsForFile: string) => {
                return {
                    entitlements: 'entitlements.plist'
                };
            }
        },
        osxNotarize,
        extraResource: ['./public']
    },
    rebuildConfig: {},
    makers: [
        new MakerSquirrel(
            {
                // The package id names the install folder and the update channel, so it stays.
                name: 'Tonkeeper',
                title: appName,
                authors: 'Ton Apps Group',
                description: 'Secure multichain crypto wallet',
                iconUrl:
                    'https://raw.githubusercontent.com/tonkeeper/tonkeeper-web/main/apps/desktop/public/icon.ico',
                setupIcon: path.join(process.cwd(), 'public', 'icon.ico'),
                loadingGif: path.join(process.cwd(), 'public', 'install.gif'),
                ...squirrelRemoteReleases
            },
            ['win32']
        ),
        new MakerZIP({}, ['darwin', 'linux', 'win32']),
        new MakerDMG(
            arch => ({
                background: path.join(process.cwd(), 'public', 'dmg-bg.png'),
                icon: path.join(process.cwd(), 'public', 'icon.icns'),
                format: 'ULFO',
                additionalDMGOptions: { window: { size: { width: 600, height: 372 } } },
                contents: [
                    {
                        x: 200,
                        y: 170,
                        type: 'file',
                        path: `${process.cwd()}/out/${appName}-darwin-${arch}/${appName}.app`
                    },
                    { x: 400, y: 170, type: 'link', path: '/Applications' }
                ]
            }),
            ['darwin']
        ),
        new MakerRpm(
            {
                options: { ...devAndRpmOptions, requires: ['libsecret'] }
            },
            ['linux']
        ),
        new MakerDeb(
            {
                options: {
                    ...devAndRpmOptions,
                    compression: 'xz',
                    depends: ['libsecret-1-0']
                } as MakerDebConfigOptions
            },
            ['linux']
        ),
        ...linuxAppImageMakers()
    ],
    plugins: [
        new AutoUnpackNativesPlugin({}),
        new WebpackPlugin({
            mainConfig,
            devContentSecurityPolicy: "script-src 'self' * 'unsafe-eval'",
            renderer: {
                config: rendererConfig,
                entryPoints: [
                    {
                        html: isDev ? './src/dev.html' : './src/index.html',
                        js: './src/renderer.ts',
                        name: mainWindowName,
                        preload: {
                            js: './src/preload.ts'
                        }
                    }
                ]
            }
        }),
        new FusesPlugin(electronFuses)
    ],
    publishers: [
        new PublisherGithub({
            repository: {
                owner: 'tonkeeper',
                name: 'tonkeeper-web'
            },
            draft: true,
            prerelease: isPrerelease
        })
    ],
    hooks: {
        // Forge reads package.json through this hook for the packager, the makers and the
        // package.json copied into the app, so it also sets what `app.getVersion()` returns.
        readPackageJson: async (_config, packageJson) => ({
            ...packageJson,
            version: resolveAppVersion(packageJson.version)
        }),
        postPackage: async (_config, { platform, outputPaths }) => {
            for (const outputPath of outputPaths) {
                const binaryPath = fuseBinaryPath(outputPath, platform, {
                    appName,
                    executableName
                });
                const mismatches = fuseMismatches(readFileSync(binaryPath));
                if (mismatches.length > 0) {
                    throw new Error(
                        `Electron fuses are not set in ${binaryPath}: ${mismatches.join('; ')}`
                    );
                }

                if (platform === 'darwin') {
                    restoreAdHocSignature(path.join(outputPath, `${appName}.app`));
                }
            }
        },
        postMake: async (_config, makeResults) => {
            const linuxX64AppImages = makeResults
                .filter(result => result.platform === 'linux' && result.arch === 'x64')
                .flatMap(result =>
                    result.artifacts.filter(artifact => artifact.endsWith('.AppImage'))
                );

            if (
                isCI &&
                process.platform === 'linux' &&
                requestedArchitecture === 'x64' &&
                linuxX64AppImages.length === 0
            ) {
                throw new Error('Linux x64 CI build did not produce an AppImage');
            }

            return makeResults;
        }
    }
};

export default config;
