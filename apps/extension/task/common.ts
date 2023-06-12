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

const readManifest = (path: string) => {
  return JSON.parse(fs.readFileSync(`${path}/manifest.json`, 'utf8'));
};

const writeManifest = (path: string, data: any) => {
  fs.writeFileSync(`${path}/manifest.json`, JSON.stringify(data));
};

const addEnvironmentVariable = (path: string, key: string, value: string) => {
  const assets = JSON.parse(
    fs.readFileSync(`${path}/asset-manifest.json`, 'utf8')
  );

  const pathToMain = assets.files['main.js'];

  let main = fs.readFileSync(`${path}${pathToMain}`, 'utf8');

  if (!main.includes(key)) {
    throw new Error(`Missing ${key} variable in the code`);
  }
  main = main.replace(new RegExp(key, 'g'), value);

  fs.writeFileSync(`${path}${pathToMain}`, main);
};

export default {
  notify,
  exec,
  readManifest,
  writeManifest,
  addEnvironmentVariable,
};
