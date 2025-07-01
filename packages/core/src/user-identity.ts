import { IStorage } from './Storage';
import { AppKey } from './Keys';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_SESSION_ID_LIFETIME = 1000 * 60 * 60 * 24; // 1 day

export interface UserIdentity {
    getFirebaseUserId?: () => Promise<string>;
    getPersistentUserId: () => Promise<string>;
    getSessionId: () => Promise<string>;
}

export class UserIdentityService implements UserIdentity {
    constructor(
        private readonly storage: IStorage,
        private readonly sessionIdLifetime = DEFAULT_SESSION_ID_LIFETIME
    ) {}

    private sessionId = this.newSessionId();

    private lastTouched = new Date();

    public async getSessionId(): Promise<string> {
        const now = new Date();
        const diffInMs = now.getTime() - this.lastTouched.getTime();
        const diffInSec = Math.floor(diffInMs / 1000);
        if (diffInSec > this.sessionIdLifetime) {
            this.sessionId = this.newSessionId();
        }
        this.lastTouched = now;

        return this.sessionId;
    }

    public async getPersistentUserId(): Promise<string> {
        const userId = await this.storage.get<string>(AppKey.USER_ID);
        if (userId) {
            return userId;
        } else {
            const newUserId = uuidv4();
            await this.storage.set(AppKey.USER_ID, newUserId);
            return newUserId;
        }
    }

    private newSessionId(): string {
        const epochInSeconds = Math.floor(Date.now() / 1000).toString();
        const random = Math.floor(Math.random() * 100000000)
            .toString()
            .padStart(8, '0');

        return epochInSeconds + random;
    }
}
