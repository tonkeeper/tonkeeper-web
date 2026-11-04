import { describe, expect, it } from 'vitest';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { assertRendererStorageKey, isRendererStorageKey } from '../rendererStorageKeys';

describe('isRendererStorageKey', () => {
    it('accepts app keys', () => {
        expect(isRendererStorageKey(AppKey.ACCOUNTS)).toBe(true);
        expect(isRendererStorageKey(AppKey.CONNECTIONS)).toBe(true);
        expect(isRendererStorageKey(AppKey.WALLET_CONNECT)).toBe(true);
    });

    it('accepts per-wallet keys', () => {
        expect(isRendererStorageKey(`${AppKey.CONNECTIONS}_wallet-id_-239`)).toBe(true);
        expect(isRendererStorageKey(`${AppKey.ACCOUNT_CONFIG}_account-id`)).toBe(true);
        expect(isRendererStorageKey(`${AppKey.TWO_FA_WALLET_CONFIG}::wallet-id`)).toBe(true);
        expect(isRendererStorageKey('home-banners-hidden:wallet-id')).toBe(true);
    });

    it('rejects keys kept by the main process', () => {
        expect(isRendererStorageKey(AppKey.KEYCHAIN_SETTINGS)).toBe(false);
        expect(isRendererStorageKey('cookie')).toBe(false);
    });

    it('rejects unknown and non-string keys', () => {
        expect(isRendererStorageKey('unknown')).toBe(false);
        expect(isRendererStorageKey('')).toBe(false);
        expect(isRendererStorageKey(undefined)).toBe(false);
        expect(isRendererStorageKey(42)).toBe(false);
    });
});

describe('assertRendererStorageKey', () => {
    it('returns accepted keys', () => {
        expect(assertRendererStorageKey(AppKey.ACCOUNTS)).toBe(AppKey.ACCOUNTS);
    });

    it('throws on rejected keys', () => {
        expect(() => assertRendererStorageKey(AppKey.KEYCHAIN_SETTINGS)).toThrow();
    });
});
