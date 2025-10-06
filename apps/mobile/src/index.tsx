import { migrateCapacitorStorage } from './libs/storage';
import { setupLogger } from './libs/logger';

async function main() {
    try {
        setupLogger();
        console.log('TEST Starting storage migration from Preferences to Keychain...');
        await migrateCapacitorStorage();
    } catch (e) {
        console.error(e);
    }

    import('./main');
}

main();
