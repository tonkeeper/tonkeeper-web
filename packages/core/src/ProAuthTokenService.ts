import { AppKey } from './Keys';
import { IStorage } from './Storage';
import { atom } from './entries/atom';
import { ITokenizedWalletAuth } from './entries/pro';

export const subscriptionFormTempAuth$ = atom<ITokenizedWalletAuth | null>(null);

export class ProAuthTokenService {
    constructor(private storage: IStorage) {}

    async getToken(): Promise<string | null> {
        return this.storage.get<string>(AppKey.PRO_AUTH_TOKEN);
    }

    async setToken(token: string) {
        await this.storage.set(AppKey.PRO_AUTH_TOKEN, token);
        subscriptionFormTempAuth$.next(null);
    }

    async deleteToken() {
        await this.storage.set(AppKey.PRO_AUTH_TOKEN, null);
        subscriptionFormTempAuth$.next(null);
    }
}
