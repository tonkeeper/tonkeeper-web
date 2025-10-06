import { IStorage } from '@tonkeeper/core/dist/Storage';
import { DeviceStorage as DeviceStoragePlugin } from './plugins/device-storage-plugin';
import { PreferencesStorage } from './preferences-storage';
import { pTimeout } from '@tonkeeper/core/dist/utils/common';

export class DeviceStorage implements IStorage {
    get = async <R>(key: string): Promise<R | null> => {
        try {
            const { value } = await DeviceStoragePlugin.get({ key });
            if (value === null) {
                return null;
            }

            try {
                return JSON.parse(value) as R;
            } catch {
                return null;
            }
        } catch (error) {
            console.error('DeviceStorage get error:', error);
            return null;
        }
    };

    set = async <R>(key: string, value: R): Promise<R> => {
        try {
            let stringValue: string;
            if (typeof value === 'string') {
                stringValue = value;
            } else {
                stringValue = JSON.stringify(value);
            }

            await DeviceStoragePlugin.set({ key, value: stringValue });
            return value;
        } catch (error) {
            console.error('DeviceStorage set error:', error);
            throw error;
        }
    };

    setBatch = async <V extends Record<string, unknown>>(values: V): Promise<V> => {
        try {
            const stringValues: Record<string, string> = {};
            for (const [key, value] of Object.entries(values)) {
                if (typeof value === 'string') {
                    stringValues[key] = value;
                } else {
                    stringValues[key] = JSON.stringify(value);
                }
            }

            await DeviceStoragePlugin.setBatch({ values: stringValues });
            return values;
        } catch (error) {
            console.error('DeviceStorage setBatch error:', error);
            throw error;
        }
    };

    delete = async <R>(key: string): Promise<R | null> => {
        try {
            const payload = await this.get<R>(key);
            if (payload !== null) {
                await DeviceStoragePlugin.delete({ key });
            }
            return payload;
        } catch (error) {
            console.error('DeviceStorage delete error:', error);
            return null;
        }
    };

    clear = async (): Promise<void> => {
        try {
            await DeviceStoragePlugin.clear();
        } catch (error) {
            console.error('DeviceStorage clear error:', error);
            throw error;
        }
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
