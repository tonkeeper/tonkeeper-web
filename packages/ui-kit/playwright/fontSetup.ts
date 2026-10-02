import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { FONT_BASE_URL, FONT_CACHE_DIR, FONT_FILES } from './fontAssets';

// Download once per test run. The font host permits the showcase origin, while
// browser-based component tests run on localhost. The cache is gitignored.
export default async function setupFonts() {
    await mkdir(FONT_CACHE_DIR, { recursive: true });

    await Promise.all(
        FONT_FILES.map(async filename => {
            const response = await fetch(new URL(filename, FONT_BASE_URL), {
                headers: { Origin: 'https://ui-showcase.keeperwallet.com' }
            });
            if (!response.ok) {
                throw new Error(`Could not download ${filename}: HTTP ${response.status}`);
            }

            const font = Buffer.from(await response.arrayBuffer());
            if (font.toString('ascii', 0, 4) !== 'wOF2') {
                throw new Error(`Downloaded ${filename} is not a WOFF2 font`);
            }
            await writeFile(join(FONT_CACHE_DIR, filename), font);
        })
    );
}
