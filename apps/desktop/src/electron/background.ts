import { shell, systemPreferences, app } from 'electron';
import keytar from 'keytar';
import { Message } from '../libs/message';
import { rendererStorage } from './storageService';
import { keychainSettings } from './keychainSettings';
import { cookieJar } from './cookie';
import { tonConnectSSE } from './sseEvetns';
import { isValidUrlProtocol } from '@tonkeeper/core/dist/utils/common';
import * as electron from 'electron';
import BaseWindow = Electron.BaseWindow;

const service = 'tonkeeper.com';

export const authorizedOpenUrlProtocols = ['http:', 'https:', 'tg:', 'mailto:'];

const CHAIN_VALUE_PREFIX = 'chain::';

const isChainValueKey = (key: string) => key.startsWith(CHAIN_VALUE_PREFIX);

const keychainAccount = (key: unknown) => {
    if (typeof key !== 'string' || key.length === 0) {
        throw new Error('Invalid keychain key');
    }
    return `Wallet-${key}`;
};

const authorizeKeychainAccess = (operation: 'get' | 'set' | 'remove', key: string) => {
    if (!isChainValueKey(key)) {
        keychainSettings.authorize({ operation, key });
    }
};

const hasStoredSecrets = async () => {
    const credentials = await keytar.findCredentials(service);
    return credentials.some(
        ({ account }) => !account.startsWith(keychainAccount(CHAIN_VALUE_PREFIX))
    );
};

const clearKeychain = async () => {
    const credentials = await keytar.findCredentials(service);

    if (credentials.length === 0) {
        return;
    }

    let failures = 0;

    for (const { account } of credentials) {
        try {
            const deleted = await keytar.deletePassword(service, account);
            if (deleted) {
                console.info(`Deleted password for account "${account}": Success`);
            } else {
                failures = failures + 1;
                console.info(
                    `Failed to delete password for account "${account}": Password not found`
                );
            }
        } catch (error) {
            failures = failures + 1;
            console.error(`Failed to delete password for account "${account}": ${error.message}`);
        }
    }

    if (failures > 0) {
        throw new Error('Some passwords could not be deleted. Check logs for details.');
    }
};

// eslint-disable-next-line complexity
export const handleBackgroundMessage = async (
    window: BaseWindow,
    message: Message
): Promise<unknown> => {
    switch (message.king) {
        case 'storage-set':
            return rendererStorage.set(message.key, message.value);
        case 'storage-get':
            return rendererStorage.get(message.key);
        case 'storage-set-batch':
            return rendererStorage.setBatch(message.value);
        case 'storage-delete':
            return rendererStorage.delete(message.key);
        case 'storage-clear':
            return rendererStorage.clear();
        case 'keychain-settings-get':
            return keychainSettings.getSecurity();
        case 'keychain-settings-check-password':
            return keychainSettings.checkPassword(message.password, message.scope);
        case 'keychain-settings-set-password':
            return keychainSettings.setPassword(message.password);
        case 'keychain-settings-set-biometry':
            return keychainSettings.setBiometry(message.enabled);
        case 'keychain-settings-reset':
            return keychainSettings.reset(hasStoredSecrets);
        case 'open-page':
            if (!isValidUrlProtocol(message.url, authorizedOpenUrlProtocols)) {
                console.error('Unacceptable url protocol', message.url);
                return;
            }

            return shell.openExternal(message.url);
        case 'set-keychain': {
            const account = keychainAccount(message.publicKey);
            if (typeof message.mnemonic !== 'string') {
                throw new Error('Invalid keychain value');
            }
            // Adding a wallet writes a key that doesn't exist yet, which can
            // neither read nor replace a stored secret; only overwrites need
            // a fresh check.
            if ((await keytar.getPassword(service, account)) !== null) {
                authorizeKeychainAccess('set', message.publicKey);
            }
            return await keytar.setPassword(service, account, message.mnemonic);
        }
        case 'get-keychain': {
            const account = keychainAccount(message.publicKey);
            authorizeKeychainAccess('get', message.publicKey);
            return await keytar.getPassword(service, account);
        }
        case 'remove-keychain': {
            const account = keychainAccount(message.publicKey);
            authorizeKeychainAccess('remove', message.publicKey);
            const result = await keytar.deletePassword(service, account);
            console.info(`Deleted password for account "${message.publicKey}": Success`);
            return result;
        }
        case 'clear-keychain':
            keychainSettings.authorize({ operation: 'clear' });
            return clearKeychain();
        case 'reconnect':
            return await tonConnectSSE.reconnect();
        case 'ton-connect-send-disconnect':
            return await tonConnectSSE.sendDisconnect(message.connection);
        case 'can-prompt-touch-id':
            try {
                return !!systemPreferences?.canPromptTouchID?.();
            } catch (e) {
                console.error(e);
                return false;
            }
        case 'prompt-touch-id':
            return keychainSettings.promptBiometry(message.reason, message.scope);
        case 'get-preferred-system-languages':
            return app.getPreferredSystemLanguages();
        case 'clean-cookie': {
            return cookieJar.removeAllCookies();
        }
        case 'get-device-country': {
            const locale = app.getLocale();
            return locale.replaceAll('_', '-').split('-')[0] || null;
        }
        case 'show-confirm-dialog': {
            return electron.dialog.showMessageBoxSync(window, message.options);
        }
        default:
            throw new Error(`Unknown message: ${JSON.stringify(message)}`);
    }
};
