import { TonTransport } from '@ton-community/ton-ledger';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import type Transport from '@ledgerhq/hw-transport';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import { getLedgerAccountPathByIndex } from './utils';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withDeadline = <T>(p: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
        p,
        new Promise((_, reject) => setTimeout(() => reject('Timeout exceeded'), ms))
    ]) as Promise<T>;

export type LedgerTonTransport = TonTransport;
export type LedgerTransaction = Parameters<TonTransport['signTransaction']>[1];

export const connectLedger = async (platform: 'web' | 'desktop') => {
    let transport: Transport;
    if (platform === 'web') {
        if (await TransportWebHID.isSupported()) {
            transport = await connectWebHID();
        } else if (await TransportWebUSB.isSupported()) {
            transport = await connectWebUSB();
        } else {
            throw new Error('Ledger is not supported');
        }
    } else {
        transport = await connectDesktopHID();
    }

    return new TonTransport(transport);
};

export const reconnect = async (
    platform: 'web' | 'desktop',
    tonTransport?: TonTransport | null
) => {
    if (await tonTransport?.isAppOpen()) {
        return tonTransport!;
    }

    const transport = await connectLedger(platform);
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

export const connectWebHID = async () => {
    return TransportWebHID.create();
};

export const connectWebUSB = async () => {
    return TransportWebUSB.create();
};

export const connectDesktopHID = async () => {
    return TransportNodeHid.create();
};
