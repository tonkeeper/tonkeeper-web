import { Address } from '@ton/core';
import { KNOWN_JETTONS } from '@ton-community/ton-ledger';
import type { TonTransport } from '@ton-community/ton-ledger';
import type { LedgerTransaction } from './connector';

export type LedgerKnownJetton = { jettonId: number; workchain: number };

export type LedgerDeviceInfo = { appVersion: string; isNanoS: boolean };

/**
 * The device identifies a jetton by its index in the TON app's own table, which matches
 * the `KNOWN_JETTONS` order. That table ends at X, so later library entries (tgBTC) would
 * be read past its end.
 */
const DEVICE_TABLE_SIZE = 10;

const BASE_APP_VERSION = '2.3.0';
const EXTENDED_APP_VERSION = '2.6.1';
const FIRST_EXTENDED_JETTON_ID = 7;

const UNKNOWN_APP_VERSION = '0.0.0';

const TX_PARSING_FAILED_STATUS = 0xb010;

export const ledgerKnownJetton = (
    master: Address,
    ownerWorkchain: number
): LedgerKnownJetton | null => {
    const jettonId = KNOWN_JETTONS.slice(0, DEVICE_TABLE_SIZE).findIndex(jetton =>
        jetton.masterAddress.equals(master)
    );
    return jettonId < 0 ? null : { jettonId, workchain: ownerWorkchain };
};

const parseVersion = (version: string) => version.split('.').map(part => Number(part) || 0);

export const isLedgerAppVersionAtLeast = (version: string, min: string) => {
    const actual = parseVersion(version);
    const required = parseVersion(min);
    for (let i = 0; i < Math.max(actual.length, required.length); i++) {
        const diff = (actual[i] ?? 0) - (required[i] ?? 0);
        if (diff !== 0) {
            return diff > 0;
        }
    }
    return true;
};

const minAppVersionForJetton = (jettonId: number) =>
    jettonId >= FIRST_EXTENDED_JETTON_ID ? EXTENDED_APP_VERSION : BASE_APP_VERSION;

export const isKnownJettonSupported = (device: LedgerDeviceInfo, jettonId: number) =>
    !device.isNanoS &&
    jettonId < DEVICE_TABLE_SIZE &&
    isLedgerAppVersionAtLeast(device.appVersion, minAppVersionForJetton(jettonId));

const withoutKnownJetton = (transaction: LedgerTransaction): LedgerTransaction => {
    const payload = transaction.payload;
    if (payload?.type !== 'jetton-transfer' || payload.knownJetton === null) {
        return transaction;
    }
    return { ...transaction, payload: { ...payload, knownJetton: null } };
};

export const adaptLedgerTransactionToDevice = (
    transaction: LedgerTransaction,
    device: LedgerDeviceInfo
): LedgerTransaction => {
    const payload = transaction.payload;
    if (payload?.type !== 'jetton-transfer' || payload.knownJetton === null) {
        return transaction;
    }
    return isKnownJettonSupported(device, payload.knownJetton.jettonId)
        ? transaction
        : withoutKnownJetton(transaction);
};

const isTxParsingFailed = (e: unknown) =>
    typeof e === 'object' &&
    e !== null &&
    'statusCode' in e &&
    (e as { statusCode: unknown }).statusCode === TX_PARSING_FAILED_STATUS;

export const readLedgerDeviceInfo = async (
    tonTransport: TonTransport
): Promise<LedgerDeviceInfo> => {
    const modelId: string | undefined = tonTransport.transport.deviceModel?.id;
    let appVersion = UNKNOWN_APP_VERSION;
    try {
        appVersion = await tonTransport.getVersion();
    } catch (e) {
        console.warn('Failed to read Ledger TON app version', e);
    }
    return { appVersion, isNanoS: modelId === 'nanoS' };
};

/**
 * The known-jetton hint only changes what the device displays, so a firmware that cannot
 * parse it gets the plain transfer instead of failing the signature.
 */
export const signLedgerTransaction = async (
    tonTransport: Pick<TonTransport, 'signTransaction'>,
    path: number[],
    transaction: LedgerTransaction,
    device: LedgerDeviceInfo
) => {
    const adapted = adaptLedgerTransactionToDevice(transaction, device);
    try {
        return await tonTransport.signTransaction(path, adapted);
    } catch (e) {
        const fallback = withoutKnownJetton(adapted);
        if (fallback === adapted || !isTxParsingFailed(e)) {
            throw e;
        }
        return tonTransport.signTransaction(path, fallback);
    }
};
