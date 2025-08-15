import { AppKey } from './Keys';
import { IStorage } from './Storage';

export class ProAuthTokenService {
    constructor(private storage: IStorage) {}

    async getToken(): Promise<string | null> {
        return this.storage.get<string>(AppKey.PRO_AUTH_TOKEN);
    }

    async setToken(token: string) {
        await this.storage.set(AppKey.PRO_AUTH_TOKEN, token);
    }

    async deleteToken() {
        await this.storage.set(AppKey.PRO_AUTH_TOKEN, null);
    }
}
