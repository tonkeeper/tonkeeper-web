import { useAppSdk } from './appSdk';
import { walletsStorage } from '@tonkeeper/core/dist/service/walletsService';
import { WalletsState } from '@tonkeeper/core/dist/entries/wallet';

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
                walletsStorage(sdk.storage).setWallets(null as unknown as WalletsState);
            }
        };
    }
};
