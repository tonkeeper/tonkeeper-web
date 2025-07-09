import { Label2 } from '../Text';
import { Button } from '../fields/Button';
import { ProLegalNote } from './ProLegalNote';
import { handleSubmit } from '../../libs/form';
import { ProFeaturesList } from './ProFeaturesList';
import { ProActiveWallet } from './ProActiveWallet';
import { ProPromoCodeInput } from './ProPromoCodeInput';
import { useTranslation } from '../../hooks/translation';
import { useProPurchaseController } from '../../state/pro';
import { ConfirmNotification } from '../settings/ProSettings';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { ProScreenContentWrapper } from './ProScreenContentWrapper';
import { ProChooseSubscriptionPlan } from './ProChooseSubscriptionPlan';
import { ProSettingsMainButtonWrapper } from './ProSettingsMainButtonWrapper';

export const ProPurchaseChooseScreen = () => {
    const { t } = useTranslation();
    const {
        isCrypto,
        isLoading,
        selectedPlanId,
        setSelectedPlanId,
        productsForRender,
        promoCode,
        setPromoCode,
        verifiedPromoCode,
        onSubmit,
        onLogout,
        onManage,
        confirmState,
        onConfirmClose,
        waitInvoice
    } = useProPurchaseController();

    return (
        <ProScreenContentWrapper onSubmit={handleSubmit(onSubmit)}>
            <ProSubscriptionHeader
                titleKey="get_tonkeeper_pro"
                subtitleKey="choose_billing_description"
            />

            <ProActiveWallet isLoading={isLoading} onLogout={onLogout} />

            <ProChooseSubscriptionPlan
                isLoading={isLoading}
                selectedPlanId={selectedPlanId}
                onPlanIdSelection={setSelectedPlanId}
                productsForRender={productsForRender}
            />

            {isCrypto && (
                <ProPromoCodeInput
                    value={promoCode}
                    onChange={setPromoCode}
                    promoCode={verifiedPromoCode}
                />
            )}

            <ProFeaturesList />

            <ProSettingsMainButtonWrapper>
                <Button primary fullWidth size="large" type="submit" loading={isLoading}>
                    <Label2>{t('continue_with_tonkeeper_pro')}</Label2>
                </Button>
                <ProLegalNote onManage={onManage} />
            </ProSettingsMainButtonWrapper>

            <ConfirmNotification
                state={confirmState}
                onClose={onConfirmClose}
                waitResult={waitInvoice}
            />
        </ProScreenContentWrapper>
    );
};
