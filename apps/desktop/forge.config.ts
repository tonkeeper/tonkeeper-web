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

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const { parsed } = dotenv.config();

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        icon: './public/icon',
        name: 'Tonkeeper',
        executableName: 'Tonkeeper',
        protocols: [
            {
                name: 'Tonkeeper Protocol',
                schemes: ['tc', 'tonkeeper', 'tonkeeper-tc']
            }
        ],
        appBundleId: parsed!.APPLE_BUILD_ID,
        osxSign: {
            optionsForFile: (optionsForFile: string) => {
                return {
                    entitlements: 'entitlements.plist'
                };
            }
        },
        osxNotarize: {
            appleApiKey: parsed!.APPLE_API_KEY,
            appleApiKeyId: parsed!.APPLE_API_KEY_ID,
            appleApiIssuer: parsed!.APPLE_API_ISSUER
        } as NotaryToolCredentials
    },
    rebuildConfig: {},
    makers: [
        new MakerSquirrel({}),
        new MakerZIP({}, ['darwin']),
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
        new MakerRpm({}),
        new MakerDeb({})
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
