import { useAppSdk } from './appSdk';
import { AccountsState } from '@tonkeeper/core/dist/entries/account';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';

export const useDebuggingTools = () => {
    const sdk = useAppSdk();
    if (typeof window !== 'undefined') {
        const activityKey =
            'I UNDERSTAND THAT BY DOING THIS I MAY LOSE ALL MY FUNDS/Я ПОНИМАЮ, ЧТО ПОДЕЛАЯ ТАК, Я МОГУ ПОТЕРЯТЬ ВСЕ СВОИ СРЕДСТВА';
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.kdt = {
            checkKey() {
                return this.key && this.key === activityKey;
            },
            clearNewWalletsStorage() {
                if (!this.checkKey()) {
                    console.error('ERR: method is not supported');
                    return;
                }
                accountsStorage(sdk.storage).setAccounts(null as unknown as AccountsState);
            }
        };
    }
};
