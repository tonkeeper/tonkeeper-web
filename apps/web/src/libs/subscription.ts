import { ICryptoSubscriptionStrategy, SubscriptionSources } from '@tonkeeper/core/dist/entries/pro';
import { ProServiceTier } from '@tonkeeper/core/dist/tonConsoleApi';
import { getProServiceTiers } from '@tonkeeper/core/dist/service/proService';
import { Language } from '@tonkeeper/core/dist/entries/language';

class CryptoSubscriptionStrategy implements ICryptoSubscriptionStrategy {
    public source = SubscriptionSources.CRYPTO as const;

    async getAllProductsInfo(
        lang: Language | undefined,
        promoCode?: string
    ): Promise<[ProServiceTier[] | undefined, string | undefined]> {
        try {
            const verifiedPromoCode = promoCode !== '' ? promoCode : undefined;
            const plans = await getProServiceTiers(lang, verifiedPromoCode);

            return [plans, verifiedPromoCode];
        } catch (e) {
            console.error('Failed to fetch products info:', e);
            return [undefined, undefined];
        }
    }
}

export const Subscription = new CryptoSubscriptionStrategy();
