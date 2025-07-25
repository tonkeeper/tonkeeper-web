import { TonTransport } from '@ton-community/ton-ledger';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import TransportWebBLE from '@ledgerhq/hw-transport-web-ble';
import type Transport from '@ledgerhq/hw-transport';
import { getLedgerAccountPathByIndex } from './utils';
import { assertUnreachable } from '../../utils/types';
import { pTimeout } from '../../utils/common';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type LedgerTonTransport = TonTransport;
export type LedgerTransaction = Parameters<TonTransport['signTransaction']>[1];
export type LedgerTonProofRequest = {
    domain: string;
    timestamp: number;
    payload: Buffer;
    testOnly?: boolean;
    bounceable?: boolean;
    chain?: number;
    subwalletId?: number;
    walletVersion?: 'v3r2' | 'v4';
};

export type LedgerTonProofResponse = {
    signature: Buffer;
    hash: Buffer;
};

export const connectLedger = async (transportType: 'wire' | 'bluetooth') => {
    let transport: Transport;

    if (transportType === 'wire') {
        if (await TransportWebHID.isSupported()) {
            transport = await pTimeout(connectWebHID(), 1500);
        } else if (await TransportWebUSB.isSupported()) {
            transport = await connectWebUSB();
        } else {
            throw new Error('Ledger is not supported');
        }
    } else if (transportType === 'bluetooth') {
        if (await TransportWebBLE.isSupported()) {
            transport = await connectWebBLE();
        } else {
            throw new Error('Ledger is not supported');
        }
    } else {
        assertUnreachable(transportType);
    }

    return new TonTransport(transport);
};

const openTonAppTimeout = 300; // TODO increase when ton ledger tonTransport.isAppOpen bug is fixed
const openTonAppRetryEvery = 100;

const isLedgerTonAppReady = async (tonTransport: TonTransport) => {
    for (let i = 0; i < Math.ceil(openTonAppTimeout / openTonAppRetryEvery); i++) {
        try {
            const isTonOpen = await tonTransport.isAppOpen();

            if (isTonOpen) {
                // Workaround for Ledger S, this is a way to check if it is unlocked.
                // There will be an error with code 0x530c
                await tonTransport.getAddress(getLedgerAccountPathByIndex(0));

                return true;
            }
        } catch (err: unknown) {
            console.error(err);
        }

        await wait(openTonAppRetryEvery);
    }

    return false;
};

export const waitLedgerTonAppReady = (tonTransport: TonTransport) => {
    /**
     * library bug: calling requests multiplie times in a short time when app is not open will lead to inconsistent subscriptions cache inside library
     */
    if (tonTransport.transport instanceof TransportWebBLE) {
        return tonTransport.isAppOpen();
    }
    return pTimeout(isLedgerTonAppReady(tonTransport), openTonAppTimeout);
};

export const isTransportReady = (tonTransport: TonTransport) => {
    return (tonTransport.transport as TransportWebHID | TransportWebUSB).device.opened;
};

async function connectWebHID() {
    for (let i = 0; i < 5; i++) {
        const [device] = await TransportWebHID.list();
        if (!device) {
            try {
                await pTimeout(TransportWebHID.create(), 100);
            } catch (err) {
                console.error(err);
            }
            await wait(100);
            continue;
        }

        if (device.opened) {
            return new TransportWebHID(device);
        } else {
            return TransportWebHID.open(device);
        }
    }

    throw new Error('Failed to connect to Ledger with HID');
}

async function connectWebUSB() {
    for (let i = 0; i < 10; i++) {
        const [device] = await TransportWebUSB.list();

        if (!device) {
            await TransportWebUSB.create();
            await wait(10);
            continue;
        }

        if (device.opened) {
            return (await TransportWebUSB.openConnected()) ?? (await TransportWebUSB.request());
        } else {
            return TransportWebUSB.open(device);
        }
    }

    throw new Error('Failed to connect to Ledger with USB');
}

async function connectWebBLE() {
    for (let i = 0; i < 10; i++) {
        try {
            return await TransportWebBLE.create();
        } catch (err) {
            console.error(err);
            await wait(100);
            continue;
        }
    }

    throw new Error('Failed to connect to Ledger with Bluetooth');
}

export async function cleanupTransport(transport: Transport) {
    if (transport instanceof TransportWebBLE) {
        await TransportWebBLE.disconnect(transport.id);
    }
}
