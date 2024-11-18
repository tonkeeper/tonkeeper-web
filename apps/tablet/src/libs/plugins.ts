import { registerPlugin } from '@capacitor/core';

export interface BiometricPlugin {
  canPrompt(): Promise<{isAvailable: boolean}>

  prompt(reason: string): Promise<void>;
}

export const Biometric = registerPlugin<BiometricPlugin>('Biometric');

