import { SubscriptionSource } from './src/pro';
import {
    AuthTypes,
    CryptoPendingSubscription,
    CryptoSubscriptionStatuses,
    ICryptoSubscriptionStrategy,
    IDisplayPlan,
    isTonWalletStandard,
    ISubscriptionConfig,
    ISubscriptionFormData,
    NormalizedProPlans,
    PurchaseStatuses
} from './src/entries/pro';
import {
    createProServiceInvoice,
    createRecipient,
    getProServiceTiers,
    ProAuthTokenType
} from './src/service/proService';
import { Language } from './src/entries/language';
import { getFormattedProPrice } from '@tonkeeper/uikit/dist/libs/pro';
import { AppKey } from './src/Keys';

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

        const { authService, api, sdk, onOpen, wallet } = config;

        if (!authService || !api || !sdk || !onOpen || !wallet) {
            throw new Error('Missing crypto purchase config!');
        }

        return await new Promise(resolve =>
            authService.withTokenContext(ProAuthTokenType.TEMP, async () => {
                if (!isTonWalletStandard(wallet)) {
                    throw new Error('Incorrect wallet type!');
                }

                const onConfirm = async (success?: boolean) => {
                    if (success) {
                        const pendingSubscription: CryptoPendingSubscription = {
                            source: SubscriptionSource.CRYPTO,
                            status: CryptoSubscriptionStatuses.PENDING,
                            valid: false,
                            displayName: formData.selectedPlan.displayName,
                            displayPrice: formData.selectedPlan.formattedDisplayPrice,
                            auth: {
                                type: AuthTypes.WALLET,
                                wallet
                            }
                        };

                        await sdk.storage.set<CryptoPendingSubscription>(
                            AppKey.PRO_PENDING_SUBSCRIPTION,
                            pendingSubscription
                        );

                        resolve(PurchaseStatuses.PENDING);
                    } else {
                        return resolve(PurchaseStatuses.CANCELED);
                    }
                };

                const invoice = await createProServiceInvoice(tierId, formData.promoCode);
                const [recipient, assetAmount] = await createRecipient(api, invoice);

                onOpen({
                    confirmState: {
                        invoice,
                        wallet,
                        recipient,
                        assetAmount
                    },
                    onConfirm,
                    onCancel: () => {
                        resolve(PurchaseStatuses.CANCELED);
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
