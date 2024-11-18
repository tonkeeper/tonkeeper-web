import { registerPlugin } from '@capacitor/core';

export interface BiometricPlugin {
  canPrompt(): Promise<{isAvailable: boolean}>

  prompt(reason: string): Promise<void>;
}

export const Biometric = registerPlugin<BiometricPlugin>('Biometric');


export interface SecureStoragePlugin {
  storeData(params:{ id: string, data: string }): Promise<void>

  getData(params:{ id: string }): Promise<{ data: string }>
}

export const SecureStorage = registerPlugin<SecureStoragePlugin>('SecureStorage');
