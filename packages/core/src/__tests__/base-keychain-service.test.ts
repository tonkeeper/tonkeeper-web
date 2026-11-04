/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, beforeEach } from 'vitest';

import { BaseKeychainService } from '../base-keychain-service';
import { AppKey } from '../Keys';
import { MemoryStorage } from '../Storage';

/**
 * In-memory subclass that exercises only the prefixed-namespace plumbing.
 * Password/biometry prompts are not used in these tests — the prefixed
 * API deliberately bypasses `securityCheck()`.
 */
class TestKeychain extends BaseKeychainService {
    raw = new Map<string, string>();

    protected override async securityCheckTouchId(): Promise<void> {
        return;
    }

    protected override promptPassword(): void {
        // intentionally empty
    }

    protected override async setRawData(key: string, value: string) {
        this.raw.set(key, value);
    }

    protected override async getRawData(key: string) {
        return this.raw.get(key) ?? null;
    }

    protected override async deleteRawData(key: string) {
        this.raw.delete(key);
    }

    clearPrefixIndexForTest = async () => {
        await this.resetPrefixIndex();
    };
}

const composedKey = (prefix: string, key: string) => `chain::${prefix}::${key}`;

describe('BaseKeychainService — prefixed namespace', () => {
    let storage: MemoryStorage;
    let keychain: TestKeychain;

    beforeEach(() => {
        storage = new MemoryStorage();
        keychain = new TestKeychain(storage);
    });

    it('setValue round-trips through getValue', async () => {
        await keychain.setValue('evm', 'cached', '0xabc');
        expect(await keychain.getValue('evm', 'cached')).toBe('0xabc');
    });

    it('getValue returns null for an unknown key', async () => {
        expect(await keychain.getValue('evm', 'missing')).toBeNull();
    });

    it('different prefixes do not collide on the same key', async () => {
        await keychain.setValue('evm', 'cached', 'evm-value');
        await keychain.setValue('btc', 'cached', 'btc-value');
        expect(await keychain.getValue('evm', 'cached')).toBe('evm-value');
        expect(await keychain.getValue('btc', 'cached')).toBe('btc-value');
    });

    it('different keys within a prefix do not collide', async () => {
        await keychain.setValue('evm', 'cached-1', 'one');
        await keychain.setValue('evm', 'cached-2', 'two');
        expect(await keychain.getValue('evm', 'cached-1')).toBe('one');
        expect(await keychain.getValue('evm', 'cached-2')).toBe('two');
    });

    it('underlying secure-store key uses the chain:: namespace', async () => {
        await keychain.setValue('evm', 'cached', 'value');
        expect(keychain.raw.has(composedKey('evm', 'cached'))).toBe(true);
        expect(keychain.raw.has('cached')).toBe(false);
        expect(keychain.raw.has('evm::cached')).toBe(false);
    });

    it('setValue tracks the key in the IStorage prefix index', async () => {
        await keychain.setValue('evm', 'cached-1', 'one');
        await keychain.setValue('evm', 'cached-2', 'two');
        const index =
            (await storage.get<Record<string, string[]>>(AppKey.KEYCHAIN_PREFIX_INDEX)) ?? {};
        expect(index.evm).toEqual([composedKey('evm', 'cached-1'), composedKey('evm', 'cached-2')]);
    });

    it('setValue on the same key twice does not duplicate the index entry', async () => {
        await keychain.setValue('evm', 'cached', 'one');
        await keychain.setValue('evm', 'cached', 'two');
        const index =
            (await storage.get<Record<string, string[]>>(AppKey.KEYCHAIN_PREFIX_INDEX)) ?? {};
        expect(index.evm).toEqual([composedKey('evm', 'cached')]);
        expect(await keychain.getValue('evm', 'cached')).toBe('two');
    });

    it('deleteValue removes the value and untracks it from the index', async () => {
        await keychain.setValue('evm', 'cached-1', 'one');
        await keychain.setValue('evm', 'cached-2', 'two');
        await keychain.deleteValue('evm', 'cached-1');

        expect(await keychain.getValue('evm', 'cached-1')).toBeNull();
        expect(await keychain.getValue('evm', 'cached-2')).toBe('two');

        const index =
            (await storage.get<Record<string, string[]>>(AppKey.KEYCHAIN_PREFIX_INDEX)) ?? {};
        expect(index.evm).toEqual([composedKey('evm', 'cached-2')]);
    });

    it('deleteValue collapses an emptied prefix out of the index', async () => {
        await keychain.setValue('evm', 'cached', 'value');
        await keychain.deleteValue('evm', 'cached');
        const index =
            (await storage.get<Record<string, string[]>>(AppKey.KEYCHAIN_PREFIX_INDEX)) ?? {};
        expect(index.evm).toBeUndefined();
    });

    it('deletePrefix removes every value under that prefix and isolates others', async () => {
        await keychain.setValue('evm', 'cached-1', 'one');
        await keychain.setValue('evm', 'cached-2', 'two');
        await keychain.setValue('btc', 'cached', 'btc-value');

        await keychain.deletePrefix('evm');

        expect(await keychain.getValue('evm', 'cached-1')).toBeNull();
        expect(await keychain.getValue('evm', 'cached-2')).toBeNull();
        expect(await keychain.getValue('btc', 'cached')).toBe('btc-value');

        const index =
            (await storage.get<Record<string, string[]>>(AppKey.KEYCHAIN_PREFIX_INDEX)) ?? {};
        expect(index.evm).toBeUndefined();
        expect(index.btc).toEqual([composedKey('btc', 'cached')]);
    });

    it('deletePrefix is a no-op when the prefix has no entries', async () => {
        await keychain.setValue('btc', 'cached', 'btc-value');
        await expect(keychain.deletePrefix('evm')).resolves.toBeUndefined();
        expect(await keychain.getValue('btc', 'cached')).toBe('btc-value');
    });

    it('resetPrefixIndex clears prefixed bookkeeping after secure-store clear', async () => {
        await keychain.setValue('evm', 'cached', 'evm-value');
        await keychain.setValue('btc', 'cached', 'btc-value');

        await keychain.clearPrefixIndexForTest();

        expect(await storage.get(AppKey.KEYCHAIN_PREFIX_INDEX)).toBeNull();
    });
});
