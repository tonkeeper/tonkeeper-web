import react from '@vitejs/plugin-react';
import * as path from 'path';
import { defineConfig } from 'vite';

const kitSrc = path.resolve(__dirname, '../../packages/ui-kit/src');

// The kit is read from source so component edits show up without a package
// rebuild.
const alias = [
    { find: /^@tonkeeper\/ui-kit$/, replacement: `${kitSrc}/index.ts` },
    { find: /^@tonkeeper\/ui-kit\/icons\/(.*)$/, replacement: `${kitSrc}/icons/components/$1` },
    { find: /^@tonkeeper\/ui-kit\/styles\.css$/, replacement: `${kitSrc}/styles/styles.css` }
];

export default defineConfig({
    // Relative asset URLs so the build can be hosted under any path.
    base: './',
    plugins: [react()],
    resolve: { alias }
});
