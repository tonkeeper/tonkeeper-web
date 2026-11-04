import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { passwordRetryDelay } from '../../libs/keychainErrors';

const stores = vi.hoisted(() => new Map<string, Map<string, unknown>>());
const promptTouchID = vi.hoisted(() => vi.fn<(reason: string) => Promise<void>>());

vi.mock('electron', () => ({
    systemPreferences: { promptTouchID }
}));

vi.mock('electron-store', () => ({
    default: class {
        private data: Map<string, unknown>;

        constructor(options?: { name?: string }) {
            const name = options?.name ?? 'config';
            const data = stores.get(name) ?? new Map<string, unknown>();
            stores.set(name, data);
            this.data = data;
        }

        get store() {
            return Object.fromEntries(this.data);
        }

        has(key: string) {
            return this.data.has(key);
        }

        get(key: string, fallback: unknown) {
            return this.data.has(key) ? this.data.get(key) : fallback;
        }

        set(key: string, value: unknown) {
            this.data.set(key, value);
        }

        delete(key: string) {
            this.data.delete(key);
        }

        clear() {
            this.data.clear();
        }
    }
}));

const loadModules = async () => {
    vi.resetModules();
    const { keychainSettings } = await import('../keychainSettings');
    const { rendererStorage, mainStorage } = await import('../storageService');
    return { keychainSettings, rendererStorage, mainStorage };
};

const sha256Hex = async (value: string) => {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(value).digest('hex');
};

describe('keychainSettings', () => {
    beforeEach(() => {
        stores.clear();
        promptTouchID.mockReset();
        promptTouchID.mockResolvedValue(undefined);
        vi.useRealTimers();
    });

    it('reports no password and no biometry by default', async () => {
        const { keychainSettings } = await loadModules();
        expect(keychainSettings.getSecurity()).toEqual({ biometry: undefined, password: false });
    });

    it('checks a stored password', async () => {
        const { keychainSettings } = await loadModules();
        keychainSettings.setPassword('1234');

        expect(keychainSettings.getSecurity().password).toBe(true);
        expect(keychainSettings.checkPassword('1234')).toBe(true);
        expect(keychainSettings.checkPassword('4321')).toBe(false);
    });

    it('picks up settings saved by earlier versions', async () => {
        const passwordHash = await sha256Hex('1234');
        stores.set(
            'config',
            new Map<string, unknown>([
                [AppKey.KEYCHAIN_SETTINGS, { passwordHash, biometryEnabled: true }]
            ])
        );

        const { keychainSettings, mainStorage } = await loadModules();

        expect(keychainSettings.getSecurity()).toEqual({ biometry: true, password: true });
        expect(keychainSettings.checkPassword('1234')).toBe(true);
        expect(await mainStorage.get(AppKey.KEYCHAIN_SETTINGS)).toBeNull();
    });

    it('is out of reach of renderer storage', async () => {
        const { keychainSettings, rendererStorage } = await loadModules();
        keychainSettings.setPassword('1234');

        await expect(rendererStorage.get(AppKey.KEYCHAIN_SETTINGS)).rejects.toThrow();
        await expect(rendererStorage.set(AppKey.KEYCHAIN_SETTINGS, {})).rejects.toThrow();
        await expect(
            rendererStorage.setBatch({ [AppKey.KEYCHAIN_SETTINGS]: {} })
        ).rejects.toThrow();
        await expect(rendererStorage.delete(AppKey.KEYCHAIN_SETTINGS)).rejects.toThrow();

        await rendererStorage.clear();
        expect(keychainSettings.getSecurity().password).toBe(true);
    });
});

const READ_A = { operation: 'get', key: 'a' } as const;

describe('keychainSettings.authorize', () => {
    beforeEach(() => {
        stores.clear();
        promptTouchID.mockReset();
        promptTouchID.mockResolvedValue(undefined);
        vi.useRealTimers();
    });

    it('passes when nothing is configured', async () => {
        const { keychainSettings } = await loadModules();
        expect(() => keychainSettings.authorize(READ_A)).not.toThrow();
    });

    it('requires a check once a password is set', async () => {
        const { keychainSettings } = await loadModules();
        keychainSettings.setPassword('1234');

        expect(() => keychainSettings.authorize(READ_A)).toThrow();
    });

    it('passes once per correct password', async () => {
        const { keychainSettings } = await loadModules();
        keychainSettings.setPassword('1234');

        keychainSettings.checkPassword('1234', READ_A);
        expect(() => keychainSettings.authorize(READ_A)).not.toThrow();
        expect(() => keychainSettings.authorize(READ_A)).toThrow();
    });

    it('passes only the operation and key the check was made for', async () => {
        const { keychainSettings } = await loadModules();
        keychainSettings.setPassword('1234');

        keychainSettings.checkPassword('1234', READ_A);
        expect(() => keychainSettings.authorize({ operation: 'get', key: 'b' })).toThrow();
        expect(() => keychainSettings.authorize({ operation: 'remove', key: 'a' })).toThrow();
        expect(() => keychainSettings.authorize({ operation: 'clear' })).toThrow();
        expect(() => keychainSettings.authorize(READ_A)).not.toThrow();
    });

    it('treats a check without a scope as one for security settings', async () => {
        const { keychainSettings } = await loadModules();
        keychainSettings.setPassword('1234');

        keychainSettings.checkPassword('1234');
        keychainSettings.checkPassword('1234', { operation: 'get' });
        expect(() => keychainSettings.authorize(READ_A)).toThrow();
        expect(() => keychainSettings.authorize({ operation: 'settings' })).not.toThrow();
        expect(() => keychainSettings.authorize({ operation: 'settings' })).not.toThrow();
    });

    it('does not pass after a wrong password', async () => {
        const { keychainSettings } = await loadModules();
        keychainSettings.setPassword('1234');

        keychainSettings.checkPassword('4321', READ_A);
        expect(() => keychainSettings.authorize(READ_A)).toThrow();
    });

    it('expires an unused check', async () => {
        vi.useFakeTimers();
        const { keychainSettings } = await loadModules();
        keychainSettings.setPassword('1234');

        keychainSettings.checkPassword('1234', READ_A);
        vi.advanceTimersByTime(31_000);
        expect(() => keychainSettings.authorize(READ_A)).toThrow();
    });

    it('passes after biometry succeeds', async () => {
        const { keychainSettings } = await loadModules();
        keychainSettings.setBiometry(true);

        await keychainSettings.promptBiometry('reason', READ_A);
        expect(promptTouchID).toHaveBeenCalledWith('reason');
        expect(() => keychainSettings.authorize({ operation: 'get', key: 'b' })).toThrow();
        expect(() => keychainSettings.authorize(READ_A)).not.toThrow();
    });

    it('does not pass after biometry fails', async () => {
        const { keychainSettings } = await loadModules();
        keychainSettings.setBiometry(true);
        promptTouchID.mockRejectedValue(new Error('cancelled'));

        await expect(keychainSettings.promptBiometry('reason', READ_A)).rejects.toThrow();
        expect(() => keychainSettings.authorize(READ_A)).toThrow();
    });

    it('slows down repeated wrong passwords', async () => {
        vi.useFakeTimers();
        const { keychainSettings } = await loadModules();
        keychainSettings.setPassword('1234');

        for (let i = 0; i < 5; i++) {
            expect(keychainSettings.checkPassword('0000')).toBe(false);
        }
        let refusal: unknown;
        try {
            keychainSettings.checkPassword('1234');
        } catch (e) {
            refusal = e;
        }
        expect(passwordRetryDelay(refusal)).toBe(1_000);

        vi.advanceTimersByTime(1_000);
        expect(keychainSettings.checkPassword('1234')).toBe(true);
    });
});

describe('keychainSettings changes', () => {
    beforeEach(() => {
        stores.clear();
        promptTouchID.mockReset();
        promptTouchID.mockResolvedValue(undefined);
        vi.useRealTimers();
    });

    it('sets the first password without a check', async () => {
        const { keychainSettings } = await loadModules();
        keychainSettings.setPassword('1234');
        expect(keychainSettings.getSecurity().password).toBe(true);
    });

    it('changes the password only after a check', async () => {
        const { keychainSettings } = await loadModules();
        keychainSettings.setPassword('1234');

        expect(() => keychainSettings.setPassword('5678')).toThrow();
        expect(keychainSettings.checkPassword('1234')).toBe(true);

        keychainSettings.checkPassword('1234');
        keychainSettings.setPassword('5678');
        expect(keychainSettings.checkPassword('5678')).toBe(true);
    });

    it('toggles biometry only after a check', async () => {
        const { keychainSettings } = await loadModules();
        keychainSettings.setPassword('1234');

        expect(() => keychainSettings.setBiometry(true)).toThrow();

        keychainSettings.checkPassword('1234');
        keychainSettings.setBiometry(true);
        expect(keychainSettings.getSecurity()).toEqual({ biometry: true, password: true });
    });

    it('resets after a check while secrets are stored', async () => {
        const { keychainSettings } = await loadModules();
        keychainSettings.setPassword('1234');

        keychainSettings.checkPassword('1234');
        await keychainSettings.reset(async () => true);

        expect(keychainSettings.getSecurity()).toEqual({ biometry: undefined, password: false });
    });

    it('refuses to reset without a check while secrets are stored', async () => {
        const { keychainSettings } = await loadModules();
        keychainSettings.setPassword('1234');

        await expect(keychainSettings.reset(async () => true)).rejects.toThrow(
            'Authorization required'
        );
        expect(keychainSettings.getSecurity().password).toBe(true);
    });

    it('resets without a check once no secrets are stored', async () => {
        const { keychainSettings } = await loadModules();
        keychainSettings.setPassword('1234');

        await keychainSettings.reset(async () => false);

        expect(keychainSettings.getSecurity()).toEqual({ biometry: undefined, password: false });
    });
});

describe('rendererStorage.clear', () => {
    beforeEach(() => {
        stores.clear();
    });

    it('removes renderer keys and keeps main-process keys', async () => {
        const { rendererStorage, mainStorage } = await loadModules();
        await rendererStorage.set(AppKey.ACCOUNTS, []);
        await mainStorage.set('cookie', {});

        await rendererStorage.clear();

        expect(await mainStorage.get(AppKey.ACCOUNTS)).toBeNull();
        expect(await mainStorage.get('cookie')).toEqual({});
    });
});
