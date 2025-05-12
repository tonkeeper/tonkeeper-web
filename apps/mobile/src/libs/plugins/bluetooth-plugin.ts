import { Plugin, PluginListenerHandle, registerPlugin } from '@capacitor/core';

interface BluetoothPlugin extends Plugin {
    getAvailability(): Promise<{ available: boolean }>;
    requestDevice(options: {
        services?: string[];
    }): Promise<{ device: { id: string; name: string } }>;
    connect(options: { deviceId: string }): Promise<{ deviceId: string }>;
    disconnect(options: { deviceId: string }): Promise<void>;
    getPrimaryServices(options: { deviceId: string }): Promise<{ services: { uuid: string }[] }>;
    getCharacteristic(options: {
        deviceId: string;
        serviceUuid: string;
        characteristicUuid: string;
    }): Promise<{ uuid: string }>;
    getCharacteristics(options: {
        deviceId: string;
        serviceUuid: string;
    }): Promise<{ characteristics: { uuid: string }[] }>;
    writeValue(options: {
        deviceId: string;
        serviceUuid: string;
        characteristicUuid: string;
        value: string;
    }): Promise<void>;
    startNotifications(options: {
        deviceId: string;
        serviceUuid: string;
        characteristicUuid: string;
    }): Promise<void>;
    stopNotifications(options: {
        deviceId: string;
        serviceUuid: string;
        characteristicUuid: string;
    }): Promise<void>;
    addListener(
        eventName: 'availabilitychanged',
        listenerFunc: (data: { value: boolean }) => void
    ): Promise<PluginListenerHandle>;
    addListener(
        eventName: 'gattserverdisconnected',
        listenerFunc: (data: { deviceId: string }) => void
    ): Promise<PluginListenerHandle>;
    addListener(
        eventName: 'characteristicValueChanged',
        listenerFunc: (data: {
            deviceId: string;
            serviceUuid: string;
            characteristicUuid: string;
            value: string;
        }) => void
    ): Promise<PluginListenerHandle>;
    removeAllListeners(): Promise<void>;
    reset(): Promise<void>;
}

interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: 'gattserverdisconnected', listener: (event: Event) => void): void;
}

interface BluetoothRemoteGATTServer {
    device: BluetoothDevice;
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothRemoteGATTService {
    uuid: string;
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
    getCharacteristic(characteristicUUID: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
    uuid: string;
    writeValue(value: ArrayBuffer): Promise<void>;
    startNotifications(): Promise<void>;
    stopNotifications(): Promise<void>;
    addEventListener(
        type: 'characteristicvaluechanged',
        listener: (event: Event & { value: ArrayBuffer }) => void
    ): void;
    removeEventListener(type: string, listener: (event: Event) => void): void;
}

interface BluetoothRequestDeviceOptions {
    filters?: { services?: string[] }[];
    optionalServices?: string[];
}

interface ExtendedBluetoothRemoteGATTCharacteristic extends BluetoothRemoteGATTCharacteristic {
    value: DataView | null;
    dispatchEvent(event: Event): void;
    addEventListener(
        type: 'characteristicvaluechanged',
        listener: (event: Event & { value: ArrayBuffer }) => void
    ): void;
}

interface ExtendedBluetoothDevice extends BluetoothDevice {
    dispatchEvent(event: Event): void;
}

export const Bluetooth = registerPlugin<BluetoothPlugin>('Bluetooth');

class EventEmitter<T extends string, V extends Event = Event> {
    protected listeners: { [event: string]: ((event: V) => void)[] } = {};

    addEventListener(type: T, listener: (event: V) => void): void {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        this.listeners[type].push(listener as (event: Event) => void);
    }

    removeEventListener(type: T, callback: (event: Event) => void): void {
        if (this.listeners[type]) {
            this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
        }
    }

    dispatchEvent(event: V): void {
        const eventName = event.type;
        if (this.listeners[eventName]) {
            Object.defineProperty(event, 'target', { value: this, writable: false });
            this.listeners[eventName].forEach(callback => callback(event));
        }
    }
}
class PolyfillCharacteristic
    extends EventEmitter<'characteristicvaluechanged', Event & { value: ArrayBuffer }>
    implements ExtendedBluetoothRemoteGATTCharacteristic {
    private _value: DataView | null = null;

    private pluginListenerHandle: PluginListenerHandle | null = null;

    constructor(public uuid: string, private deviceId: string, private serviceUuid: string) {
        super();
    }

    private async subscribeGlobal() {
        if (this.pluginListenerHandle) {
            return;
        }
        this.pluginListenerHandle = await Bluetooth.addListener(
            'characteristicValueChanged',
            (data: {
                deviceId: string;
                serviceUuid: string;
                characteristicUuid: string;
                value: string;
            }) => {
                if (
                    data.deviceId === this.deviceId &&
                    data.serviceUuid === this.serviceUuid &&
                    data.characteristicUuid === this.uuid
                ) {
                    const value = Buffer.from(data.value, 'base64');
                    const arrayBuffer = value.buffer.slice(
                        value.byteOffset,
                        value.byteOffset + value.byteLength
                    );
                    this._value = new DataView(arrayBuffer);
                    const event = new Event('characteristicvaluechanged') as Event & {
                        value: ArrayBuffer;
                    };
                    event.value = arrayBuffer;
                    this.dispatchEvent(event);
                }
            }
        );
    }

    override addEventListener(
        type: 'characteristicvaluechanged',
        listener: (event: Event & { value: ArrayBuffer }) => void
    ) {
        if (type !== 'characteristicvaluechanged') {
            return;
        }

        super.addEventListener(type, listener);
        this.subscribeGlobal();
    }

    override removeEventListener(
        type: 'characteristicvaluechanged',
        callback: (event: Event) => void
    ): void {
        if (type !== 'characteristicvaluechanged') {
            return;
        }

        super.removeEventListener(type, callback);
        if (!this.listeners[type]?.length && this.pluginListenerHandle) {
            this.pluginListenerHandle.remove();
            this.pluginListenerHandle = null;
        }
    }

    get value(): DataView | null {
        return this._value;
    }

    async writeValue(value: ArrayBuffer): Promise<void> {
        const base64Value = Buffer.from(value).toString('base64');
        await Bluetooth.writeValue({
            deviceId: this.deviceId,
            serviceUuid: this.serviceUuid,
            characteristicUuid: this.uuid,
            value: base64Value
        });
    }

    async startNotifications(): Promise<void> {
        await Bluetooth.startNotifications({
            deviceId: this.deviceId,
            serviceUuid: this.serviceUuid,
            characteristicUuid: this.uuid
        });
    }

    async stopNotifications(): Promise<void> {
        await Bluetooth.stopNotifications({
            deviceId: this.deviceId,
            serviceUuid: this.serviceUuid,
            characteristicUuid: this.uuid
        });
    }
}

class PolyfillService implements BluetoothRemoteGATTService {
    constructor(public uuid: string, private deviceId: string) {}

    async getCharacteristics(): Promise<ExtendedBluetoothRemoteGATTCharacteristic[]> {
        const result = await Bluetooth.getCharacteristics({
            deviceId: this.deviceId,
            serviceUuid: this.uuid
        });
        return result.characteristics.map(char => {
            return new PolyfillCharacteristic(char.uuid, this.deviceId, this.uuid);
        });
    }

    async getCharacteristic(
        characteristicUUID: string
    ): Promise<ExtendedBluetoothRemoteGATTCharacteristic> {
        const result = await Bluetooth.getCharacteristic({
            deviceId: this.deviceId,
            serviceUuid: this.uuid,
            characteristicUuid: characteristicUUID
        });
        return new PolyfillCharacteristic(result.uuid, this.deviceId, this.uuid);
    }
}

class PolyfillGATTServer implements BluetoothRemoteGATTServer {
    constructor(public device: ExtendedBluetoothDevice) {
        this.connected = false;
    }

    connected: boolean;

    async connect(): Promise<BluetoothRemoteGATTServer> {
        await Bluetooth.connect({ deviceId: this.device.id });
        this.connected = true;
        return this;
    }

    disconnect(): void {
        Bluetooth.disconnect({ deviceId: this.device.id });
        this.connected = false;
        const event = new Event('gattserverdisconnected');
        this.device.dispatchEvent(event);
    }

    async getPrimaryServices(): Promise<BluetoothRemoteGATTService[]> {
        const result = await Bluetooth.getPrimaryServices({ deviceId: this.device.id });
        return (result.services as { uuid: string }[]).map(
            service => new PolyfillService(service.uuid, this.device.id)
        );
    }
}

class PolyfillDevice
    extends EventEmitter<'gattserverdisconnected'>
    implements ExtendedBluetoothDevice {
    private pluginListenerHandle: PluginListenerHandle | null = null;

    gatt?: BluetoothRemoteGATTServer;

    constructor(public id: string, public name?: string) {
        super();
        this.gatt = new PolyfillGATTServer(this);
    }

    private async subscribeGlobal() {
        if (this.pluginListenerHandle) {
            return;
        }
        this.pluginListenerHandle = await Bluetooth.addListener(
            'gattserverdisconnected',
            (data: { deviceId: string }) => {
                if (data.deviceId === this.id) {
                    this.gatt!.connected = false;
                    const event = new Event('gattserverdisconnected');
                    this.dispatchEvent(event);
                }
            }
        );
    }

    override addEventListener(type: 'gattserverdisconnected', listener: (event: Event) => void) {
        if (type !== 'gattserverdisconnected') {
            return;
        }

        super.addEventListener(type, listener);
        this.subscribeGlobal();
    }

    override removeEventListener(
        type: 'gattserverdisconnected',
        callback: (event: Event) => void
    ): void {
        if (type !== 'gattserverdisconnected') {
            return;
        }

        super.removeEventListener(type, callback);
        if (!this.listeners[type]?.length && this.pluginListenerHandle) {
            this.pluginListenerHandle.remove();
            this.pluginListenerHandle = null;
        }
    }
}

export const BluetoothPolyfill = {
    async getAvailability(): Promise<boolean> {
        const result = await Bluetooth.getAvailability();
        return result.available;
    },

    async requestDevice(options: BluetoothRequestDeviceOptions): Promise<ExtendedBluetoothDevice> {
        await Bluetooth.reset();
        const services = options.filters?.flatMap(f => f.services); // || getBluetoothServiceUuids();
        const result = await Bluetooth.requestDevice({ services: services as string[] });
        const device = result.device as { id: string; name: string };
        return new PolyfillDevice(device.id, device.name);
    },

    listenerHandles: new Map<(event: Event) => void, PluginListenerHandle>(),

    async addEventListener(event: string, callback: (event: Event) => void) {
        if (event === 'availabilitychanged') {
            const handle = await Bluetooth.addListener(
                'availabilitychanged',
                (data: { value: boolean }) => {
                    const e = new Event('availabilitychanged') as Event & { value: boolean };
                    e.value = data.value;
                    callback(e);
                }
            );
            this.listenerHandles.set(callback, handle);
        }
    },

    async removeEventListener(event: string, callback: (event: Event) => void) {
        if (event === 'availabilitychanged') {
            const handle = this.listenerHandles.get(callback);
            if (handle) {
                await handle.remove();
                this.listenerHandles.delete(callback);
            }
        }
    }
};
