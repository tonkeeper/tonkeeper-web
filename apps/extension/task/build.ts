import child_process, { execSync } from 'child_process';
import fs from 'fs-extra';

const notify = (value: string) => console.log(`----------${value}----------`);

const exec = (cmd: string, options: Record<string, any>) => {
  try {
    return (
      execSync(cmd, {
        shell: '/bin/sh',
        stdio: 'inherit',
        ...(options ?? {}),
        env: { ...process.env, ...(options?.env ?? {}) },
      }) ?? ''
    ).toString();
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

notify('Build UI');

exec('npx react-app-rewired build', {
  stdio: 'inherit',
  env: {
    ...process.env,
    INLINE_RUNTIME_CHUNK: false,
  },
});

notify(`Build Tonkeeper background.js, provider.js, content.js`);

exec('npx webpack -c ./task/webpack.config.js', {
  stdio: 'inherit',
  env: process.env,
});

notify('Copy Locales');

const srcDir = `../../packages/locales/dist/extension`;
const destDir = `build/_locales`;
fs.copySync(srcDir, destDir, { overwrite: true });

notify(`Create Chrome Build`);

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const buildDir = `build`;
const buildDirChrome = `dist/chrome`;
const buildDirFireFox = `dist/firefox`;

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist');
fs.mkdirSync(buildDirChrome);
fs.mkdirSync(buildDirFireFox);

fs.copySync(buildDir, buildDirChrome);

const manifestChrome = `${buildDirChrome}/manifest.json`;
const manifestChromeData = JSON.parse(fs.readFileSync(manifestChrome, 'utf8'));
manifestChromeData.version = packageJson.version;
fs.writeFileSync(manifestChrome, JSON.stringify(manifestChromeData));

child_process.execSync(
  `zip tonkeeper_chrome_${manifestChromeData.version}.zip -r ${buildDirChrome}/ *`,
  {
    cwd: buildDirChrome + '/',
  }
);

notify(`Create FireFox Build`);

fs.copySync(buildDir, buildDirFireFox);

const manifest = `${buildDirFireFox}/manifest.json`;
const manifestFFData = JSON.parse(fs.readFileSync(manifest, 'utf8'));
manifestFFData.version = packageJson.version;
manifestFFData.background = {
  scripts: ['background.js'],
};
fs.writeFileSync(manifest, JSON.stringify(manifestFFData));

child_process.execSync(
  `zip tonkeeper_firefox_${manifestChromeData.version}.zip -r ${buildDirFireFox}/ *`,
  {
    cwd: buildDirFireFox + '/',
  }
);

notify('End Build Extension');
