import { IStorage } from '@tonkeeper/core/dist/Storage';
import { DeviceStorage as DeviceStoragePlugin } from './plugins/device-storage-plugin';
import { PreferencesStorage } from './preferences-storage';
import { pTimeout } from '@tonkeeper/core/dist/utils/common';

export class DeviceStorage implements IStorage {
    get = async <R>(key: string): Promise<R | null> => {
        const { value } = await DeviceStoragePlugin.get({ key });
        return value ? (value as R) : null;
    };

    set = async <R>(key: string, value: R) => {
        await DeviceStoragePlugin.set<R>({ key, value });
        return value;
    };

    setBatch = async <V extends Record<string, unknown>>(values: V) => {
        await DeviceStoragePlugin.setBatch({ values });
        return values;
    };

    delete = async <R>(key: string) => {
        const payload = await this.get<R>(key);
        if (payload !== null) {
            await DeviceStoragePlugin.delete({ key });
        }
        return payload;
    };

    clear = async (): Promise<void> => {
        await DeviceStoragePlugin.clear();
    };
}

const deviceStorage = new DeviceStorage();
const preferencesStorage = new PreferencesStorage();
let capacitorStorage: IStorage = preferencesStorage;

export function getCapacitorStorage() {
    return capacitorStorage;
}

export async function migrateCapacitorStorage() {
    const storageMigrationService = new StorageMigrationService();
    await pTimeout(storageMigrationService.migrate(), 10000);
    const isMigrationCompleted = await storageMigrationService.isMigrationCompleted();

    if (isMigrationCompleted) {
        capacitorStorage = deviceStorage;
    }
}

export class StorageMigrationService {
    private oldStorage: PreferencesStorage;

    private newStorage: DeviceStorage;

    private migrationKey = 'STORAGE_MIGRATION_COMPLETED';

    constructor() {
        this.oldStorage = new PreferencesStorage();
        this.newStorage = new DeviceStorage();
    }

    public async isMigrationCompleted(): Promise<boolean> {
        try {
            const migrationFlag = await this.newStorage.get<boolean>(this.migrationKey);
            return migrationFlag === true;
        } catch (error) {
            console.error('Error checking migration status:', error);
            return false;
        }
    }

    private async migrateKey(key: string): Promise<boolean> {
        try {
            const value = await this.oldStorage.get(key);

            if (value !== null) {
                await this.newStorage.set(key, value);
                console.log(`Migrated key: ${key}`);
                return true;
            } else {
                console.log(`Key ${key} has null value, skipping migration`);
                return false;
            }
        } catch (error) {
            console.error(`Error migrating key ${key}:`, error);
            return false;
        }
    }

    private async cleanupOldStorage(migratedKeys: string[]): Promise<void> {
        try {
            console.log(`Cleaning up ${migratedKeys.length} keys from old storage`);

            for (const key of migratedKeys) {
                try {
                    await this.oldStorage.delete(key);
                } catch (error) {
                    console.error(`Error removing key ${key} from old storage:`, error);
                }
            }

            console.log('Old storage cleanup completed');
        } catch (error) {
            console.error('Error during old storage cleanup:', error);
        }
    }

    private async markMigrationCompleted(): Promise<void> {
        await this.newStorage.set(this.migrationKey, true);
    }

    async migrate(): Promise<void> {
        if (await this.isMigrationCompleted()) {
            return;
        }

        console.log('Starting storage migration from Preferences to Keychain...');

        const errors: string[] = [];
        let migratedCount = 0;

        try {
            const allKeys = await this.oldStorage.keys();

            if (allKeys.length === 0) {
                console.log('No keys found in old storage, marking migration as completed');
                await this.markMigrationCompleted();
                return;
            }

            console.log(`Found ${allKeys.length} keys in old storage`);

            const keysToMigrate = allKeys.filter(key => key !== this.migrationKey);
            const migratedKeys: string[] = [];

            for (const key of keysToMigrate) {
                try {
                    const success = await this.migrateKey(key);
                    if (success) {
                        migratedCount++;
                        migratedKeys.push(key);
                    }
                } catch (error) {
                    const errorMsg = `Failed to migrate key ${key}: ${error}`;
                    console.error(errorMsg);
                    errors.push(errorMsg);
                }
            }

            if (errors.length === 0) {
                await this.cleanupOldStorage(migratedKeys);
                await this.markMigrationCompleted();
            } else {
                console.log('Migration completed with errors, skipping cleanup');
            }

            console.log(
                `Migration completed: ${migratedCount}/${keysToMigrate.length} keys migrated`
            );
        } catch (error) {
            const errorMsg = `Migration failed: ${error}`;
            console.error(errorMsg);
        }
    }
}
