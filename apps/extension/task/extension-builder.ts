import fs from 'fs-extra';
import path from 'path';
import { build } from 'vite';
import child_process from 'child_process';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import { resolveAppVersion } from '../../../scripts/app-version';

export const notify = (value: string) => console.log(`----------${value}----------`);

/**
 * Repo-root `.env` values for local builds (see `.env.example`), e.g.
 * WALLETCONNECT_PROJECT_ID. Shell environment (CI) takes precedence.
 */
const readRootDotEnv = (): Record<string, string> => {
    try {
        const content = fs.readFileSync(path.resolve(__dirname, '../../../.env'), 'utf8');
        return Object.fromEntries(
            content
                .split('\n')
                .map(line => line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/))
                .filter((m): m is RegExpMatchArray => m !== null)
                .map(m => [m[1], m[2].trim()])
        );
    } catch (e) {
        return {};
    }
};

type DistDirectory = 'chrome' | 'firefox';

export const BUILD_BASE_PATH = 'dist';

export class ExtensionBuilder {
    public readonly version: string;

    public readonly manifestVersion: string;

    public readonly manifestVersionName: string | undefined;

    private readonly isDevMode = process.env.NODE_ENV === 'development';

    private readonly env: Record<string, string>;

    private readonly configs = [
        'vite.config.background.ts',
        'vite.config.content.ts',
        'vite.config.provider.ts',
        'vite.config.main.ts'
    ];

    private readonly buildPath: string;

    constructor(private readonly directory: DistDirectory) {
        this.buildPath = `${BUILD_BASE_PATH}/${directory}`;
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (!('version' in packageJson) || typeof packageJson.version !== 'string') {
            throw new Error('Invalid package.json');
        }
        this.version = resolveAppVersion(packageJson.version);
        const { manifestVersion, manifestVersionName } = toManifestVersion(this.version);
        this.manifestVersion = manifestVersion;
        this.manifestVersionName = manifestVersionName;

        const { PATH, ...baseEnv } = process.env;
        this.env = {
            ...readRootDotEnv(),
            ...baseEnv,
            REACT_APP_DEV_MODE: this.isDevMode.toString()
        } as Record<string, string>;
    }

    public async build(extraEnv: Record<string, string>) {
        fs.rmSync(this.buildPath, { recursive: true, force: true });
        fs.mkdirSync(this.buildPath, { recursive: true });

        process.env.VITE_BUILD_DIR = this.buildPath;
        for (const config of this.configs) {
            try {
                await build({
                    mode: this.isDevMode ? 'development' : 'production',
                    configFile: config,
                    define: {
                        'process.env': { ...this.env, ...extraEnv },
                        __APP_VERSION__: JSON.stringify(this.version),
                        __WALLETCONNECT_PROJECT_ID__: JSON.stringify(
                            extraEnv.WALLETCONNECT_PROJECT_ID ??
                                this.env.WALLETCONNECT_PROJECT_ID ??
                                ''
                        )
                    }
                });
            } catch (error) {
                console.error(`Vite build for ${this.directory} (${config}) failed:`, error);
                process.exit(1);
            }
        }

        this.verifyBuild();
        this.copyLocales();
        this.copyWalletCoreWasm();
        this.updateManifestVersion();
    }

    /**
     * chain-kit's Trust Wallet Core wasm (~10 MB) is served from the extension
     * root and loaded via the fetch shim in `src/wallet-core-wasm-path.ts`.
     * Copied from the package at build time rather than committed per shell.
     */
    private copyWalletCoreWasm() {
        const pkgJson = require.resolve('@trustwallet/wallet-core/package.json');
        const wasm = path.join(path.dirname(pkgJson), 'dist/lib/wallet-core.wasm');
        fs.copySync(wasm, `${this.buildPath}/wallet-core.wasm`, { overwrite: true });
    }

    public verifyBuild() {
        const files = fs.readdirSync(this.buildPath);
        console.log(`${this.directory} Build Output:`, files);
        if (!fs.existsSync(`${this.buildPath}/background.js`)) {
            console.error(`Error: ${this.buildPath}/background.js is missing`);
            process.exit(1);
        }
        const staticJsFiles = fs.readdirSync(`${this.buildPath}/static/js`);
        console.log(`${this.directory} static/js Output:`, staticJsFiles);
        const mainJsFile = staticJsFiles.find(
            file => file.startsWith('main.') && file.endsWith('.js')
        );
        if (!mainJsFile) {
            console.error(`Error: ${this.buildPath}/static/js/main.[hash].js is missing`);
            process.exit(1);
        }
    }

    private copyLocales() {
        const srcDir = `../../packages/locales/dist/extension`;
        fs.copySync(srcDir, `${this.buildPath}/_locales`, { overwrite: true });
        this.applyBrandToLocales();
    }

    /**
     * The manifest name/description are localized by Chrome from _locales/<lang>/messages.json and
     * do NOT run our runtime `%{...}` interpolation. Bake the brand values in here at build time so
     * the extension name stays driven by the single BRAND_CONFIG source (edit it + rebuild).
     */
    private applyBrandToLocales() {
        const localesDir = `${this.buildPath}/_locales`;
        const subs: Record<string, string> = {
            '%{chainName}': BRAND_CONFIG.chainName,
            '%{coinName}': BRAND_CONFIG.coinName,
            '%{coinSymbol}': BRAND_CONFIG.coinSymbol
        };
        for (const lang of fs.readdirSync(localesDir)) {
            const file = `${localesDir}/${lang}/messages.json`;
            if (!fs.existsSync(file)) continue;
            const data = fs.readJsonSync(file) as Record<string, { message?: string }>;
            for (const key of Object.keys(data)) {
                const msg = data[key]?.message;
                if (typeof msg !== 'string') continue;
                data[key].message = Object.entries(subs).reduce(
                    (acc, [ph, val]) => acc.split(ph).join(val),
                    msg
                );
            }
            fs.writeJsonSync(file, data, { spaces: 2 });
        }
    }

    private updateManifestVersion() {
        const manifestData = this.readManifest();
        this.applyManifestVersion(manifestData);
        this.writeManifest(manifestData);
    }

    public applyManifestVersion(manifestData: any) {
        manifestData.version = this.manifestVersion;
        // `version_name` is Chrome-only; Firefox warns on unknown manifest keys.
        if (this.directory === 'chrome' && this.manifestVersionName) {
            manifestData.version_name = this.manifestVersionName;
        } else {
            delete manifestData.version_name;
        }
    }

    /**
     * Chrome Web Store public key of the published extension
     * (id omaabbefbmiijedngplfjmnooppbclkk). Baking it into the unpacked
     * build's manifest gives locally-loaded builds the same extension id —
     * and therefore the same chrome-extension:// origin — as production.
     * Origin-allowlisted services (the Reown/WalletConnect relay) only need
     * the one production origin approved. Must be applied AFTER `archive()`:
     * store uploads reject manifests that contain `key`.
     */
    private static readonly CHROME_STORE_PUBLIC_KEY =
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5zmu2m6B5PgVNwkO9A5bgqspVjw0bchsuPc6u9Px2iGjK9xcWJ/ZNUI+HzgKJq30Quwe1U3sXKwOprkXlMiUUz0IGKKD+p6HCuu2pBGjnih55FXVyr5wL+fR7Rwi8ZZSmJWzlmL3fX8T7ZZD5nm0EXb8Hwya0azCIOgwEuGVDYiYv9HoDqO4u6q9vUpCovZP8xPB4AsaFloB8QwP8n9hm/ZbisN+2yoNRsxZfK0nemWw73cPNYbFg6qkDr5DYTZWhY+SYS7QGzRZRUpEe4SHehHlV0zhMu0CHv75hbLFZlunrNAxJaVgGMwblkuap9lzySLltqDZdYAaCPL8jDaaxQIDAQAB';

    public pinUnpackedExtensionId() {
        if (this.directory !== 'chrome') {
            return;
        }
        const manifestData = this.readManifest();
        manifestData.key = ExtensionBuilder.CHROME_STORE_PUBLIC_KEY;
        this.writeManifest(manifestData);
    }

    public archive() {
        child_process.execSync(
            `zip ../tonkeeper_${this.directory}_v${this.version}.zip -r ${this.buildPath}/ *`,
            {
                cwd: `${this.buildPath}/`
            }
        );
    }

    public readManifest() {
        return JSON.parse(fs.readFileSync(`${this.buildPath}/manifest.json`, 'utf8'));
    }

    public writeManifest(data: any) {
        fs.writeFileSync(`${this.buildPath}/manifest.json`, JSON.stringify(data));
    }
}

// Chrome/Firefox require manifest `version` to be 1-4 dot-separated integers (0-65536).
// A semver like "4.6.2-pre.3" is rejected, so we map the pre-release counter into a
// 4th numeric segment ("4.6.2.3") and keep the original semver in `version_name` for
// display in chrome://extensions. Returns undefined name when no remap was needed.
export function toManifestVersion(semver: string): {
    manifestVersion: string;
    manifestVersionName: string | undefined;
} {
    const [core, prerelease] = semver.split('-', 2);
    if (!prerelease) {
        return { manifestVersion: core, manifestVersionName: undefined };
    }
    const trailingInt = prerelease.match(/(\d+)$/);
    const coreSegments = core.split('.');
    const manifestVersion =
        coreSegments.length < 4 && trailingInt ? `${core}.${trailingInt[1]}` : core;
    return { manifestVersion, manifestVersionName: semver };
}
