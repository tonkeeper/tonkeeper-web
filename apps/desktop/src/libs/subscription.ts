import { SubscriptionSource } from '@tonkeeper/core/dist/pro';
import {
    ICryptoSubscriptionStrategy,
    IDisplayPlan,
    PurchaseStatuses,
    NormalizedProPlans,
    ISubscriptionConfig,
    ISubscriptionFormData
} from '@tonkeeper/core/dist/entries/pro';
import {
    createProServiceInvoice,
    createRecipient,
    getProServiceTiers,
    ProAuthTokenType
} from '@tonkeeper/core/dist/service/proService';
import { Language } from '@tonkeeper/core/dist/entries/language';
import { getFormattedProPrice } from '@tonkeeper/uikit/dist/libs/pro';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';

class CryptoSubscriptionStrategy implements ICryptoSubscriptionStrategy {
    public source = SubscriptionSource.CRYPTO as const;

    async subscribe(
        formData: ISubscriptionFormData,
        config: ISubscriptionConfig
    ): Promise<PurchaseStatuses> {
        if (!formData.selectedPlan) {
            throw new Error('missing selectedPlan');
        }

        const { id } = formData.selectedPlan;
        const tierId = Number(id);

        if (tierId === null) {
            throw new Error('missing tier');
        }

        const { authService, api, ws, onConfirm, onOpen, targetAuth } = config;

        if (!authService || !api || !ws || !onConfirm || !onOpen || !targetAuth) {
            throw new Error('Missing crypto purchase config!');
        }

        return await new Promise((resolve, reject) =>
            authService.withTokenContext(ProAuthTokenType.TEMP, async () => {
                const wallet = (await ws.getAccounts())
                    .flatMap(a => a.allTonWallets)
                    .find(w => w.id === targetAuth?.wallet?.rawAddress);

                if (!wallet || !isStandardTonWallet(wallet)) {
                    throw new Error('Missing wallet');
                }

                const invoice = await createProServiceInvoice(tierId, formData.promoCode);
                const [recipient, assetAmount] = await createRecipient(api, invoice);

                onOpen({
                    confirmState: {
                        invoice,
                        wallet,
                        recipient,
                        assetAmount
                    },
                    onConfirm: (success?: boolean) => {
                        onConfirm?.(success);

                        if (success) {
                            resolve(PurchaseStatuses.PENDING);
                        } else {
                            reject(PurchaseStatuses.CANCELED);
                        }
                    }
                });
            })
        );
    }

    async getAllProductsInfo(lang?: Language, promoCode?: string): Promise<NormalizedProPlans> {
        try {
            const verifiedPromoCode = promoCode !== '' ? promoCode : undefined;
            const plans = await getProServiceTiers(lang, verifiedPromoCode);

            const normalizedPlans: IDisplayPlan[] = plans.map(plan => ({
                id: String(plan.id),
                displayName: plan.name,
                displayPrice: plan.amount,
                subscriptionPeriod: 'year',
                formattedDisplayPrice: getFormattedProPrice(plan.amount, true)
            }));

            return { plans: normalizedPlans, verifiedPromoCode };
        } catch (e) {
            console.error('Failed to fetch products info:', e);
            return { plans: undefined, verifiedPromoCode: undefined };
        }
    }
}

export const Subscription = new CryptoSubscriptionStrategy();
