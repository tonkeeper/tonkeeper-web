import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // @ton-keychain/core ships ESM with extensionless internal imports that
        // Node's strict resolver rejects. Inlining lets Vite transform & resolve
        // them, so modules that depend on it (e.g. mnemonicService) are testable.
        server: {
            deps: {
                inline: [/@ton-keychain\/core/]
            }
        }
    }
});
