import { migrateCapacitorStorage } from './libs/storage';
import { capacitorFileLogger } from './libs/logger';

async function main() {
    try {
        capacitorFileLogger.overrideConsole();
        await migrateCapacitorStorage();
    } catch (e) {
        console.error(e);
    }

    import('./main');
}

main();
