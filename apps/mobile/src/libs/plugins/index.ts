import { BluetoothPolyfill } from './bluetooth-plugin';

export { SecureStorage } from './secure-storage-plugin';
export { Subscription } from './subscription-plugin';
export { Biometric } from './biometry-plugin';
export { Bluetooth } from './bluetooth-plugin';
export { DeepLink } from './deep-link-plugin';

Object.defineProperty(navigator, 'bluetooth', {
    value: BluetoothPolyfill,
    writable: false
});
