import { migrateCapacitorStorage } from './libs/storage';
import { capacitorFileLogger } from './libs/logger';

async function main() {
    try {
        capacitorFileLogger.overrideConsole();
        await migrateCapacitorStorage();
        document.getElementById('root')!.textContent = 'Очистка хранилища завершена';
        document.getElementById('root')!.style.color = 'red';
    } catch (e) {
        console.error(e);
    }

    import('./main');
}

main();
