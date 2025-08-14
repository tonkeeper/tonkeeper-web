import { ProAuthTokenType } from './service/proService';
import { AppKey } from './Keys';
import { OpenAPI } from './pro';
import { IStorage } from './Storage';

type KeyMap = Record<ProAuthTokenType, AppKey>;
const KEY_MAP: KeyMap = {
    [ProAuthTokenType.MAIN]: AppKey.PRO_AUTH_TOKEN,
    [ProAuthTokenType.TEMP]: AppKey.PRO_TEMP_AUTH_TOKEN
};

export class ProAuthTokenService {
    constructor(private storage: IStorage) {}

    async attachToken(type = ProAuthTokenType.MAIN) {
        const token = await this.storage.get<string>(KEY_MAP[type]);

        OpenAPI.TOKEN = token ?? undefined;
    }

    async getToken(type: ProAuthTokenType): Promise<string | null> {
        return this.storage.get<string>(KEY_MAP[type]);
    }

    async setToken(type: ProAuthTokenType, token: string | null) {
        await this.storage.set(KEY_MAP[type], token);

        if (type === ProAuthTokenType.MAIN) {
            OpenAPI.TOKEN = token ?? undefined;
        }
    }

    async deleteToken(type: ProAuthTokenType) {
        await this.storage.delete(KEY_MAP[type]);
    }

    async promoteToken(from: ProAuthTokenType, to: ProAuthTokenType) {
        const token = await this.getToken(from);

        if (token) {
            await this.setToken(to, token);
            await this.deleteToken(from);

            if (to === ProAuthTokenType.MAIN) {
                OpenAPI.TOKEN = token;
            }
        }
    }

    async withTokenContext<T>(type: ProAuthTokenType, fn: () => Promise<T>): Promise<T> {
        const originalToken = OpenAPI.TOKEN;

        const token = await this.getToken(type);
        OpenAPI.TOKEN = token ?? undefined;

        try {
            return await fn();
        } finally {
            OpenAPI.TOKEN = originalToken;
        }
    }
}
