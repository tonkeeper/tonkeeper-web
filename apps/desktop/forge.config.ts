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

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const { parsed } = dotenv.config();

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        icon: './public/icon',
        name: 'Tonkeeper Pro',
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
        new MakerDMG({}, ['darwin']),
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
