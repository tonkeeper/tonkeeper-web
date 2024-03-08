import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { PublisherGithub } from '@electron-forge/publisher-github';
import type { ForgeConfig } from '@electron-forge/shared-types';
import type { NotaryToolCredentials } from '@electron/notarize/lib/types';
import dotenv from 'dotenv';
import path from 'path';

import { MakerDebConfigOptions } from '@electron-forge/maker-deb/dist/Config';
import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

dotenv.config();

const schemes = ['tc', 'tonkeeper', 'tonkeeper-tc'];

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
                remoteReleases: 'https://github.com/tonkeeper/tonkeeper-web'
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
                options: devAndRpmOptions
            },
            ['linux']
        ),
        new MakerDeb(
            {
                options: { ...devAndRpmOptions, compression: 'xz' } as MakerDebConfigOptions
            },
            ['linux']
        )
    ],
    plugins: [
        new AutoUnpackNativesPlugin({}),
        new WebpackPlugin({
            mainConfig,
            devContentSecurityPolicy: "connect-src 'self' * 'unsafe-eval'",
            renderer: {
                config: rendererConfig,
                entryPoints: [
                    {
                        html: './src/index.html',
                        js: './src/renderer.ts',
                        name: 'main_window',
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
            draft: true
        })
    ]
};

export default config;
