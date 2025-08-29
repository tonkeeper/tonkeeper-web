import {
    ICryptoPendingSubscription,
    IDisplayPlan,
    isPendingSubscription,
    ISubscriptionFormData,
    ISubscriptionService,
    ISubscriptionServiceConfig,
    isValidSubscription,
    ProSubscription,
    PurchaseStatuses,
    SubscriptionStrategy
} from './src/entries/pro';
import { AuthService, SubscriptionSource } from './src/pro';
import { getNormalizedSubscription, IProAuthTokenService } from './src/service/proService';
import { IStorage } from './src/Storage';
import { ProAuthTokenService } from './src/ProAuthTokenService';
import { AppKey } from './src/Keys';
import { pickBestSubscription } from './src/utils/pro';
import { Language } from './src/entries/language';

export class SubscriptionService implements ISubscriptionService {
    private _authTokenService: IProAuthTokenService;
    private _strategiesMap: Map<SubscriptionSource, SubscriptionStrategy>;

    constructor(public storage: IStorage, config: ISubscriptionServiceConfig) {
        this._strategiesMap = config.initialStrategyMap ?? new Map();
        this._authTokenService = new ProAuthTokenService(storage);
    }

    async subscribe(
        source: SubscriptionSource,
        formData: ISubscriptionFormData
    ): Promise<PurchaseStatuses> {
        const strategy = this._strategiesMap.get(source)!;

        return strategy.subscribe(formData);
    }

    async getSubscription(tempToken: string | null): Promise<ProSubscription> {
        const pendingSubscription: ICryptoPendingSubscription | null = await this.storage.get(
            AppKey.PRO_PENDING_SUBSCRIPTION
        );

        const mainToken = await this._authTokenService.getToken();
        const targetToken = tempToken ?? pendingSubscription?.auth?.tempToken ?? null;

        const [currentSubscription, targetSubscription] = await Promise.all([
            getNormalizedSubscription(this.storage, mainToken),
            getNormalizedSubscription(this.storage, targetToken)
        ]);

        if (tempToken && isValidSubscription(targetSubscription)) {
            await this._authTokenService.setToken(tempToken);
            await this._clearPendingSubscription(this.storage);

            return targetSubscription;
        }

        if (isPendingSubscription(pendingSubscription)) {
            return {
                ...pendingSubscription,
                valid: Boolean(currentSubscription?.valid)
            };
        }

        const bestSubscription = pickBestSubscription(currentSubscription, targetSubscription);

        if (isValidSubscription(bestSubscription)) {
            await this._clearPendingSubscription(this.storage);
        }

        return bestSubscription;
    }

    private async _clearPendingSubscription(storage: IStorage) {
        await storage.delete(AppKey.PRO_PENDING_SUBSCRIPTION);
    }

    async getAllProductsInfo(source: SubscriptionSource, lang?: Language): Promise<IDisplayPlan[]> {
        try {
            const strategy = this._strategiesMap.get(source);

            if (!strategy) {
                return [];
            }

            return await strategy.getAllProductsInfoCore(lang);
        } catch (e) {
            console.error('Failed to fetch products info:', e);

            return [];
        }
    }

    async getToken(): Promise<string | null> {
        return this._authTokenService.getToken();
    }

    async activateTrial(token: string) {
        await this._authTokenService.setToken(token);
        await this.storage.set<boolean>(AppKey.PRO_USED_TRIAL, true);
    }

    async logout() {
        try {
            const mainToken = await this._authTokenService.getToken();

            if (mainToken) {
                await AuthService.logout(`Bearer ${mainToken}`);
                await this._authTokenService.deleteToken();
            }
        } finally {
            await this._authTokenService.deleteToken();
        }
    }

    getAvailableSources(): ReadonlyArray<SubscriptionSource> {
        return Array.from(this._strategiesMap.keys()).sort((a, b) => {
            if (a === SubscriptionSource.CRYPTO) return -1;
            if (b === SubscriptionSource.CRYPTO) return 1;

            return 0;
        });
    }

    getStrategy(source: SubscriptionSource): SubscriptionStrategy | undefined {
        return this._strategiesMap.get(source);
    }

    addStrategy(strategy: SubscriptionStrategy) {
        this._strategiesMap.set(strategy.source, strategy);
    }
}
