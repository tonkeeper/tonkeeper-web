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
import { existsSync, readFileSync, readdirSync, renameSync, rmSync, unlinkSync } from 'fs';
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
const executableName = 'Tonkeeper';

// Bundle libsecret + transitive deps into the AppImage so it runs on systems
// where libsecret is not preinstalled. See github.com/tonkeeper/tonkeeper-web/issues/374
function bundleLibsecretIntoAppImage(appImagePath: string) {
    const workDir = path.dirname(appImagePath);
    const linuxdeploy = process.env.LINUXDEPLOY_PATH || 'linuxdeploy';
    const libsecret = process.env.LIBSECRET_PATH || '/usr/lib/x86_64-linux-gnu/libsecret-1.so.0';

    const skipOrThrow = (message: string) => {
        if (isCI) throw new Error(message);
        console.warn(`[libsecret bundling] ${message}, skipping ${appImagePath}`);
    };

    if (
        spawnSync(linuxdeploy, ['--appimage-extract-and-run', '--version'], { stdio: 'ignore' })
            .status !== 0
    ) {
        skipOrThrow('linuxdeploy not available');
        return;
    }
    if (!existsSync(libsecret)) {
        skipOrThrow(`${libsecret} not found`);
        return;
    }

    const appDir = path.join(workDir, 'squashfs-root');
    if (existsSync(appDir)) rmSync(appDir, { recursive: true, force: true });

    const beforeFiles = new Set(readdirSync(workDir));
    const extract = spawnSync(appImagePath, ['--appimage-extract'], {
        cwd: workDir,
        stdio: 'inherit'
    });
    if (extract.status !== 0) throw new Error('AppImage --appimage-extract failed');

    const deploy = spawnSync(
        linuxdeploy,
        [
            '--appimage-extract-and-run',
            '--appdir',
            appDir,
            '--library',
            libsecret,
            '--output',
            'appimage'
        ],
        {
            cwd: workDir,
            stdio: 'inherit',
            env: {
                ...process.env,
                LD_LIBRARY_PATH: [path.join(appDir, 'usr', 'lib'), process.env.LD_LIBRARY_PATH]
                    .filter(Boolean)
                    .join(path.delimiter)
            }
        }
    );
    if (deploy.status !== 0) throw new Error('linuxdeploy --output appimage failed');

    const newAppImage = readdirSync(workDir).find(
        f => f.endsWith('.AppImage') && !beforeFiles.has(f)
    );
    if (!newAppImage) throw new Error('linuxdeploy did not produce a new AppImage');

    unlinkSync(appImagePath);
    renameSync(path.join(workDir, newAppImage), appImagePath);
    rmSync(appDir, { recursive: true, force: true });
    console.log(`[libsecret bundling] repacked ${appImagePath}`);
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
    // install and data. genericName and description are display-only metadata.
    name: 'Tonkeeper',
    productName: 'Tonkeeper',
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

// The AppImage maker imports app-builder-lib internals that the pinned app-builder-lib no longer
// ships, so a top-level import fails config loading on every platform. Load it only where it runs.
const linuxAppImageMakers = () => {
    if (process.platform !== 'linux' || requestedArchitecture !== 'x64') {
        return [];
    }

    const MakerAppImage: typeof MakerAppImageType =
        require('@pengx17/electron-forge-maker-appimage').default;
    return [new MakerAppImage({ options: devAndRpmOptions }, ['linux'])];
};

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        icon: path.join(__dirname, 'public', 'icon'),
        name: 'Tonkeeper',
        executableName,
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
                name: 'Tonkeeper',
                authors: 'Ton Apps Group',
                description: 'Secure multichain crypto wallet',
                iconUrl: 'https://tonkeeper.com/assets/icon.ico',
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
                        path: `${process.cwd()}/out/Tonkeeper-darwin-${arch}/Tonkeeper.app`
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
                const binaryPath = fuseBinaryPath(outputPath, platform, executableName);
                const mismatches = fuseMismatches(readFileSync(binaryPath));
                if (mismatches.length > 0) {
                    throw new Error(
                        `Electron fuses are not set in ${binaryPath}: ${mismatches.join('; ')}`
                    );
                }

                if (platform === 'darwin') {
                    restoreAdHocSignature(path.join(outputPath, `${executableName}.app`));
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

            for (const result of makeResults) {
                if (result.platform !== 'linux' || result.arch !== 'x64') continue;
                for (const artifact of result.artifacts) {
                    if (artifact.endsWith('.AppImage')) {
                        bundleLibsecretIntoAppImage(artifact);
                    }
                }
            }
            return makeResults;
        }
    }
};

export default config;
