import { TonTransport } from '@ton-community/ton-ledger';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import type Transport from '@ledgerhq/hw-transport';
import { getLedgerAccountPathByIndex } from './utils';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withDeadline = <T>(p: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
        p,
        new Promise((_, reject) => setTimeout(() => reject('Timeout exceeded'), ms))
    ]) as Promise<T>;

export type LedgerTonTransport = TonTransport;
export type LedgerTransaction = Parameters<TonTransport['signTransaction']>[1];

export const connectLedger = async () => {
    let transport: Transport;
    if (await TransportWebHID.isSupported()) {
        transport = await connectWebHID();
    } else if (await TransportWebUSB.isSupported()) {
        transport = await connectWebUSB();
    } else {
        throw new Error('Ledger is not supported');
    }

    return new TonTransport(transport);
};

export const reconnect = async (tonTransport?: TonTransport | null) => {
    if (await tonTransport?.isAppOpen()) {
        return tonTransport!;
    }

    const transport = await connectLedger();
    await waitLedgerTonAppReady(transport);
    return transport;
};

const isLedgerTonAppReady = async (tonTransport: TonTransport) => {
    for (let i = 0; i < 10; i++) {
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

        await wait(100);
    }

    return false;
};

export const waitLedgerTonAppReady = (tonTransport: TonTransport) => {
    return withDeadline(isLedgerTonAppReady(tonTransport), 15000);
};

export const isTransportReady = (tonTransport: TonTransport) => {
    return (tonTransport.transport as TransportWebHID | TransportWebUSB).device.opened;
};

async function connectWebHID() {
    for (let i = 0; i < 10; i++) {
        const [device] = await TransportWebHID.list();

        if (!device) {
            await TransportWebHID.create();
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
