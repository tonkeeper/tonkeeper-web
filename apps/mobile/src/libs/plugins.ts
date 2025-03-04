import { registerPlugin } from '@capacitor/core';

export interface BiometricPlugin {
  canPrompt(): Promise<{isAvailable: boolean}>

  prompt(reason: string): Promise<void>;
}

export const Biometric = registerPlugin<BiometricPlugin>('Biometric', {
  web: () => {
    return {
      async canPrompt(){ return {isAvailable: false}},
      async prompt() { }
    }
  }
});


export interface SecureStoragePlugin {
  storeData(params:{ id: string, data: string }): Promise<void>

  getData(params:{ id: string }): Promise<{ data: string }>
}

export const SecureStorage = registerPlugin<SecureStoragePlugin>('SecureStorage', {
  web: () => {
    return {
      async storeData(params:{ id: string, data: string }) {
        localStorage.setItem('[TK_MOBILE_WEB_SECURE_STORAGE_IMPL]' + params.id, params.data);
      },
      async getData(params:{ id: string }): Promise<{ data: string }> {
        return {data: localStorage.getItem('[TK_MOBILE_WEB_SECURE_STORAGE_IMPL]' + params.id)!}
      }
    }
  }
});
