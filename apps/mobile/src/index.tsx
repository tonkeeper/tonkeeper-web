import { migrateCapacitorStorage } from './libs/storage';
import { setupLogger } from './libs/logger';

async function main() {
    try {
        setupLogger();
        await migrateCapacitorStorage();
    } catch (e) {
        console.error(e);
    }

    import('./main');
}

main();
