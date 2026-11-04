import react from '@vitejs/plugin-react';
import * as path from 'path';
import { defineConfig, loadEnv } from 'vite';

const repoRoot = path.resolve(__dirname, '../..');

const DEFAULT_OLD_ORIGIN = 'https://wallet.tonkeeper.com';
const DEFAULT_NEW_ORIGIN = 'https://web.keeperwallet.com';

/**
 * Strip any path and trailing slash so the value is always a bare origin the
 * app can concatenate paths onto.
 */
const normalizeOrigin = (value: string, fallback: string): string => {
    try {
        return new URL(value).origin;
    } catch {
        return fallback;
    }
};

export default defineConfig(({ mode }) => {
    // Build-time env (CI) wins over the repo-root `.env` (local dev). The
    // destination is pinned at build time on purpose: nothing the browser sends
    // can retarget a handoff.
    const env = loadEnv(mode, repoRoot, '');

    const newOrigin = normalizeOrigin(
        process.env.MIGRATION_NEW_ORIGIN || env.MIGRATION_NEW_ORIGIN || DEFAULT_NEW_ORIGIN,
        DEFAULT_NEW_ORIGIN
    );

    // Only the dev server needs this — it's the origin this app is itself
    // served on, which the bundle never has to name.
    const oldOrigin = normalizeOrigin(
        process.env.MIGRATION_OLD_ORIGIN || env.MIGRATION_OLD_ORIGIN || DEFAULT_OLD_ORIGIN,
        DEFAULT_OLD_ORIGIN
    );

    return {
        define: {
            __MIGRATION_NEW_ORIGIN__: JSON.stringify(newOrigin)
        },
        plugins: [react()],
        server: {
            // The old origin needs its own port: an origin is scheme + host +
            // port, so running on a different port from the wallet's dev server
            // is what gives the two sides separate localStorage locally.
            port: 5174,
            strictPort: true,
            // Vite rejects a Host header it doesn't know, so allow the host the
            // old origin is configured as — for when it isn't localhost.
            allowedHosts: [new URL(oldOrigin).hostname]
        }
    };
});
