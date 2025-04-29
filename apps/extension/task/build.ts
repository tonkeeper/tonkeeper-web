import * as child_process from 'child_process';
import dotenv from 'dotenv';
import * as fs from 'fs-extra';
import { build } from 'vite';
import chrome from './chrome';
import common from './common';
import firefox from './fireFox';

dotenv.config();

async function runBuild() {
  common.notify('Build UI and Extension Scripts');

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const isDevMode = process.env.NODE_ENV === 'development';

  const { PATH, ...envToPass } = process.env;

  const baseEnv = {
    ...envToPass,
    VITE_BUILD_DIR: '', // Will be set per build
    NODE_ENV: isDevMode ? 'development' : 'production'
  };

  // Configurations to build
  const configs = [
    'vite.config.background.ts',
    'vite.config.content.ts',
    'vite.config.provider.ts',
    'vite.config.main.ts'
  ];

  // Build for Chrome
  common.notify(`Create Chrome Build ${packageJson.version}`);
  process.env.VITE_BUILD_DIR = 'dist/chrome';

  const chromeEnv = {
    ...baseEnv,
    REACT_APP_EXTENSION_TYPE: 'Chrome',
    REACT_APP_STORE_URL: 'https://chromewebstore.google.com/detail/tonkeeper-%E2%80%94-wallet-for-to/omaabbefbmiijedngplfjmnooppbclkk/reviews',
    REACT_APP_APTABASE: process.env.REACT_APP_APTABASE,
    REACT_APP_APTABASE_HOST: process.env.REACT_APP_APTABASE_HOST,
    REACT_APP_DEV_MODE: isDevMode.toString()
  };

  // Clear the output directory before starting
  fs.rmSync('dist/chrome', { recursive: true, force: true });
  fs.mkdirSync('dist/chrome', { recursive: true });

  // Build each configuration separately
  for (const config of configs) {
    try {
      await build({
        mode: isDevMode ? 'development' : 'production',
        configFile: config,
        define: {
          'process.env': chromeEnv
        }
      });
    } catch (error) {
      console.error(`Vite build for Chrome (${config}) failed:`, error);
      process.exit(1);
    }
  }

  // Verify Chrome build output
  const chromeFiles = fs.readdirSync('dist/chrome');
  console.log('Chrome Build Output:', chromeFiles);
  if (!fs.existsSync('dist/chrome/background.js')) {
    console.error('Error: dist/chrome/background.js is missing');
    process.exit(1);
  }
  const staticJsFiles = fs.readdirSync('dist/chrome/static/js');
  console.log('Chrome static/js Output:', staticJsFiles);
  const mainJsFile = staticJsFiles.find(file => file.startsWith('main.') && file.endsWith('.js'));
  if (!mainJsFile) {
    console.error('Error: dist/chrome/static/js/main.[hash].js is missing');
    process.exit(1);
  }

  // Copy locales for Chrome
  const srcDir = `../../packages/locales/dist/extension`;
  const chromeDestDir = `dist/chrome/_locales`;
  fs.copySync(srcDir, chromeDestDir, { overwrite: true });

  chrome.updateChromeManifest('dist/chrome', packageJson.version);

  child_process.execSync(
    `zip ../tonkeeper_chrome_v${packageJson.version}.zip -r dist/chrome/ *`,
    {
      cwd: 'dist/chrome/'
    }
  );

  common.updateApplicationName(
    'dist/chrome',
    'Tonkeeper BETA',
    'THIS EXTENSION IS FOR BETA TESTING'
  );

  child_process.execSync(
    `zip ../tonkeeper_chrome_beta_v${packageJson.version}.zip -r dist/chrome/ *`,
    {
      cwd: 'dist/chrome/'
    }
  );

  // Build for Firefox
  common.notify(`Create FireFox Build ${packageJson.version}`);
  process.env.VITE_BUILD_DIR = 'dist/firefox';
  const firefoxEnv = {
    ...baseEnv,
    REACT_APP_EXTENSION_TYPE: 'FireFox',
    REACT_APP_STORE_URL: 'https://addons.mozilla.org/en-US/firefox/addon/tonkeeper/',
    REACT_APP_APTABASE: process.env.REACT_APP_APTABASE,
    REACT_APP_APTABASE_HOST: process.env.REACT_APP_APTABASE_HOST,
    REACT_APP_DEV_MODE: isDevMode.toString(),
  };

  // Clear the output directory before starting
  fs.rmSync('dist/firefox', { recursive: true, force: true });
  fs.mkdirSync('dist/firefox', { recursive: true });

  // Build each configuration separately
  for (const config of configs) {
    try {
      await build({
        mode: isDevMode ? 'development' : 'production',
        configFile: config,
        define: {
          'process.env': firefoxEnv
        }
      });
    } catch (error) {
      console.error(`Vite build for Firefox (${config}) failed:`, error);
      process.exit(1);
    }
  }

  // Verify Firefox build output
  const firefoxFiles = fs.readdirSync('dist/firefox');
  console.log('Firefox Build Output:', firefoxFiles);
  if (!fs.existsSync('dist/firefox/background.js')) {
    console.error('Error: dist/firefox/background.js is missing');
    process.exit(1);
  }
  const firefoxStaticJsFiles = fs.readdirSync('dist/firefox/static/js');
  console.log('Firefox static/js Output:', firefoxStaticJsFiles);
  const firefoxMainJsFile = firefoxStaticJsFiles.find(file => file.startsWith('main.') && file.endsWith('.js'));
  if (!firefoxMainJsFile) {
    console.error('Error: dist/firefox/static/js/main.[hash].js is missing');
    process.exit(1);
  }

  // Copy locales for Firefox
  const firefoxDestDir = `dist/firefox/_locales`;
  fs.copySync(srcDir, firefoxDestDir, { overwrite: true });

  firefox.updateFireFoxManifest('dist/firefox', packageJson.version);

  child_process.execSync(
    `zip ../tonkeeper_firefox_v${packageJson.version}.zip -r dist/firefox/ *`,
    {
      cwd: 'dist/firefox/'
    }
  );

  common.notify('End Build Extension');
}

runBuild();
