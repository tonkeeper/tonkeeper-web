import { AppKey } from '../../Keys';
import { IStorage } from '../../Storage';

/**
 * WalletConnect `Core` storage backed by the app's `IStorage`. `IStorage`
 * cannot enumerate keys, so the whole WalletConnect key/value map is one
 * JSON record under `AppKey.WALLET_CONNECT` — the SDK's working set is
 * small (sessions, pairings, relay bookkeeping). Keeping it in app
 * storage (instead of the SDK's default loose IndexedDB) makes sessions
 * portable across platform shells and visible to tests.
 *
 * Implements the SDK's `IKeyValueStorage` contract structurally; mutations
 * are serialized through a promise chain so concurrent SDK writes cannot
 * interleave read-modify-write cycles.
 */
export class WalletConnectStorage {
    private cache: Record<string, unknown> | null = null;

    private writeChain: Promise<unknown> = Promise.resolve();

    constructor(private storage: IStorage) {}

    private async read(): Promise<Record<string, unknown>> {
        if (this.cache === null) {
            this.cache =
                (await this.storage.get<Record<string, unknown>>(AppKey.WALLET_CONNECT)) ?? {};
        }
        return this.cache;
    }

    private mutate(fn: (map: Record<string, unknown>) => void): Promise<void> {
        // A failed write must not reject every write queued after it.
        this.writeChain = this.writeChain
            .catch(() => undefined)
            .then(async () => {
                const map = await this.read();
                fn(map);
                // Desktop storage crosses Electron IPC, which rejects what structured clone
                // cannot copy; the SDK keeps telemetry events with their methods. Web storage
                // keeps this same JSON copy.
                await this.storage.set(AppKey.WALLET_CONNECT, JSON.parse(JSON.stringify(map)));
            });
        return this.writeChain as Promise<void>;
    }

    async getKeys(): Promise<string[]> {
        return Object.keys(await this.read());
    }

    async getEntries<T = unknown>(): Promise<[string, T][]> {
        return Object.entries(await this.read()) as [string, T][];
    }

    async getItem<T = unknown>(key: string): Promise<T | undefined> {
        const map = await this.read();
        return map[key] as T | undefined;
    }

    async setItem<T = unknown>(key: string, value: T): Promise<void> {
        return this.mutate(map => {
            map[key] = value;
        });
    }

    async removeItem(key: string): Promise<void> {
        return this.mutate(map => {
            delete map[key];
        });
    }
}
