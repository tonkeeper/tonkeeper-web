import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import MakerAppImage from '@pengx17/electron-forge-maker-appimage';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { PublisherGithub } from '@electron-forge/publisher-github';
import type { ForgeConfig } from '@electron-forge/shared-types';
import type { NotaryToolCredentials } from '@electron/notarize/lib/types';
import path from 'path';

import { MakerDebConfigOptions } from '@electron-forge/maker-deb/dist/Config';
import { spawnSync } from 'child_process';
import { existsSync, readdirSync, renameSync, rmSync, unlinkSync } from 'fs';
import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';
import { mainWindowName } from './src/constants';

const isDev = process.env.NODE_ENV === 'development';
const isPrerelease = process.env.GITHUB_REF_NAME?.includes('-') ?? false;
const githubToken = process.env.GITHUB_TOKEN;

// Bundle libsecret + transitive deps into the AppImage so it runs on systems
// where libsecret is not preinstalled. See github.com/tonkeeper/tonkeeper-web/issues/374
function bundleLibsecretIntoAppImage(appImagePath: string) {
    const workDir = path.dirname(appImagePath);
    const linuxdeploy = process.env.LINUXDEPLOY_PATH || 'linuxdeploy';
    const libsecret = process.env.LIBSECRET_PATH || '/usr/lib/x86_64-linux-gnu/libsecret-1.so.0';
    const isRequired = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

    const skipOrThrow = (message: string) => {
        if (isRequired) throw new Error(message);
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
        { cwd: workDir, stdio: 'inherit' }
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

const schemes = ['tc', 'tonkeeper', 'tonkeeper-tc'];
const squirrelRemoteReleases = githubToken
    ? {
          // SyncReleases uses the GitHub API for repo URLs, so keep PR/local builds offline.
          remoteReleases: 'https://github.com/tonkeeper/tonkeeper-web',
          remoteToken: githubToken
      }
    : {};

const devAndRpmOptions = {
    name: 'Tonkeeper',
    productName: 'Tonkeeper',
    genericName: 'Tonkeeper',
    license: 'Apache-2.0',
    maintainer: 'Ton Apps Group',
    bin: 'Tonkeeper', // bin name
    description: 'Your desktop wallet on The Open Network',
    homepage: 'https://tonkeeper.com',
    icon: path.join(__dirname, 'public', 'icon.png'),
    mimeType: schemes.map(schema => `x-scheme-handler/${schema}`)
};

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        icon: path.join(__dirname, 'public', 'icon'),
        name: 'Tonkeeper',
        executableName: 'Tonkeeper',
        protocols: [
            {
                name: 'Tonkeeper Protocol',
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
        osxNotarize: {
            appleApiKey: process.env.APPLE_API_KEY,
            appleApiKeyId: process.env.APPLE_API_KEY_ID,
            appleApiIssuer: process.env.APPLE_API_ISSUER
        } as NotaryToolCredentials,
        extraResource: ['./public']
    },
    rebuildConfig: {},
    makers: [
        new MakerSquirrel(
            {
                name: 'Tonkeeper',
                authors: 'Ton Apps Group',
                description: 'Your desktop wallet on The Open Network',
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
        ...(['x64', 'arm64'].includes(process.argv[3])
            ? [
                  new MakerAppImage(
                      {
                          options: devAndRpmOptions
                      },
                      ['linux']
                  )
              ]
            : [])
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
        })
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
        postMake: async (_config, makeResults) => {
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
