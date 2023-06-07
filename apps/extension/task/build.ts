import { execSync } from 'child_process';
import fs from 'fs-extra';
import zl from 'zip-lib';

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

(async () => {
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

  const buildDir = `build`;
  const buildDirChrome = `dist/chrome`;
  const buildDirFireFox = `dist/firefox`;

  fs.rmSync('dist', { recursive: true, force: true });
  fs.mkdirSync('dist');
  fs.mkdirSync(buildDirChrome);
  fs.mkdirSync(buildDirFireFox);

  const manifestChrome = `${buildDirChrome}/manifest.json`;
  const manifestChromeData = JSON.parse(
    fs.readFileSync(manifestChrome, 'utf8')
  );

  fs.copySync(buildDir, buildDirChrome, { overwrite: true });

  await zl.archiveFolder(
    buildDirChrome,
    `${buildDirChrome}/tonkeeper_chrome_${manifestChromeData.version}.zip`
  );

  notify(`Create FireFox Build`);

  fs.copySync(buildDir, buildDirFireFox, { overwrite: true });

  const manifest = `${buildDirFireFox}/manifest.json`;
  const manifestFFData = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  manifestFFData.background = {
    scripts: ['background.js'],
  };
  fs.writeFileSync(manifest, JSON.stringify(manifestFFData));

  await zl.archiveFolder(
    buildDirFireFox,
    `${buildDirFireFox}/tonkeeper_firefox_${manifestFFData.version}.zip`
  );

  notify('End Build Extension');
})()
  .then(process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
