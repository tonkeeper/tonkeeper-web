import { execSync } from 'child_process';
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

notify('End Build Extension');
