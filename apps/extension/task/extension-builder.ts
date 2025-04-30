import fs from 'fs-extra';
import { build } from "vite";
import child_process from "child_process";

export const notify = (value: string) => console.log(`----------${value}----------`);

type DistDirectory = 'chrome' | 'firefox';

export const BUILD_BASE_PATH = 'dist';

export class ExtensionBuilder {
    public readonly version: string;

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
        this.version = packageJson.version;

        const { PATH, ...baseEnv } = process.env;
        this.env = {
            ...baseEnv,
            REACT_APP_DEV_MODE: this.isDevMode.toString()
        };
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
                        'process.env': {...this.env, ...extraEnv}
                    }
                });
            } catch (error) {
                console.error(`Vite build for ${this.directory} (${config}) failed:`, error);
                process.exit(1);
            }
        }

        this.verifyBuild();
        this.copyLocales();
        this.updateManifestVersion();
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
        const mainJsFile = staticJsFiles.find(file => file.startsWith('main.') && file.endsWith('.js'));
        if (!mainJsFile) {
            console.error(`Error: ${this.buildPath}/static/js/main.[hash].js is missing`);
            process.exit(1);
        }
    }

    private copyLocales() {
        const srcDir = `../../packages/locales/dist/extension`;
        fs.copySync(srcDir, `${this.buildPath}/_locales`, { overwrite: true });
    }

    private updateManifestVersion() {
        const manifestData = this.readManifest();
        manifestData.version = this.version;
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

    public readManifest(){
        return JSON.parse(fs.readFileSync(`${this.buildPath}/manifest.json`, 'utf8'));
    };

    public writeManifest(data: any) {
        fs.writeFileSync(`${this.buildPath}/manifest.json`, JSON.stringify(data));
    };
}
