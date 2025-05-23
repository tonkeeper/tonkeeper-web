import { shell, systemPreferences, app } from 'electron';
import keytar from 'keytar';
import { Message } from '../libs/message';
import { mainStorage } from './storageService';
import { cookieJar } from './cookie';
import { tonConnectSSE } from './sseEvetns';
import { isValidUrlProtocol } from '@tonkeeper/core/dist/utils/common';

const service = 'tonkeeper.com';

const authorizedOpenUrlProtocols = ['http:', 'https:', 'tg:', 'mailto:'];

// eslint-disable-next-line complexity
export const handleBackgroundMessage = async (message: Message): Promise<unknown> => {
    switch (message.king) {
        case 'storage-set':
            return mainStorage.set(message.key, message.value);
        case 'storage-get':
            return mainStorage.get(message.key);
        case 'storage-set-batch':
            return mainStorage.setBatch(message.value);
        case 'storage-delete':
            return mainStorage.delete(message.key);
        case 'storage-clear':
            return mainStorage.clear();
        case 'open-page':
            if (!isValidUrlProtocol(message.url, authorizedOpenUrlProtocols)) {
                console.error('Unacceptable url protocol', message.url);
                return;
            }

            return shell.openExternal(message.url);
        case 'set-keychain':
            if (message.mnemonic.startsWith('../') || message.mnemonic.startsWith('./')) {
                console.error('Unacceptable value to store in keychain');
                return;
            }
            return await keytar.setPassword(
                service,
                `Wallet-${message.publicKey}`,
                message.mnemonic
            );
        case 'get-keychain':
            return await keytar.getPassword(service, `Wallet-${message.publicKey}`);
        case 'remove-keychain': {
            const result = await keytar.deletePassword(service, `Wallet-${message.publicKey}`);
            console.info(`Deleted password for account "${message.publicKey}": Success`);
            return result;
        }
        case 'clear-keychain': {
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
                    console.error(
                        `Failed to delete password for account "${account}": ${error.message}`
                    );
                }
            }

            if (failures > 0) {
                throw new Error('Some passwords could not be deleted. Check logs for details.');
            }
            return;
        }
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
            return systemPreferences.promptTouchID(message.reason);
        case 'get-preferred-system-languages':
            return app.getPreferredSystemLanguages();
        case 'clean-cookie': {
            return cookieJar.removeAllCookies();
        }
        default:
            throw new Error(`Unknown message: ${JSON.stringify(message)}`);
    }
};
