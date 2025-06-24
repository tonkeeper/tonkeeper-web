const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const generate = require('./json-schema.generator').generateInterfaces;

const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/tonkeeper/analytics-schemas/refs/heads/main/`;


const OUTPUT_DIR = path.resolve(__dirname, '../src/analytics');

fs.mkdirSync(path.dirname(OUTPUT_DIR), { recursive: true });


async function fetchJSON(url: string): Promise<any> {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${url}`);
  }

  try {
    return await res.json();
  } catch (err) {
    throw new Error(`Invalid JSON from ${url}`);
  }
}

function getOutputFileName(schemaPath: string) {
  return path.basename(schemaPath).replace('.json', '.ts');
}

function getOutputPath(schemaName: string) {
  return path.join(OUTPUT_DIR, getOutputFileName(schemaName));
}

async function fetchAndGenerateAll() {
  const indexUrl = `${GITHUB_RAW_BASE}index.json`;
  const config: {
    events: string[],
    main: string
  } = await fetchJSON(indexUrl + '?v=5');
  const files = config.events;


  const unions = await Promise.all(files.map(async fileName => {
    const schemaRaw = await fetchJSON(GITHUB_RAW_BASE + fileName);
    const { code, reexportUnion } = generate(schemaRaw, { namePrefix: 'AnalyticsEvent' });
    const targetName = getOutputPath(fileName);
    await fs.promises.writeFile(targetName, code, { encoding: 'utf8' });
    return reexportUnion;
  }));

  const exportEntries = unions.map((u, index) => `export { ${u} } from './${getOutputFileName(files[index]).replace('.ts', '')}';`).join('\n\n') + '\n';

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), exportEntries);
  try {
    child_process.execSync(`npx eslint --fix '${OUTPUT_DIR}/*.ts'`, { stdio: 'inherit' });
  } catch (_) {
  }
  console.log('✅ All schemas fetched and TypeScript files generated.');
}

fetchAndGenerateAll();
