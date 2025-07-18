import { useId } from 'react';
import styled from 'styled-components';

import { Label2 } from '../Text';
import { Button } from '../fields/Button';
import { ProLegalNote } from './ProLegalNote';
import { handleSubmit } from '../../libs/form';
import { ProFeaturesList } from './ProFeaturesList';
import { ProActiveWallet } from './ProActiveWallet';
import { ProPromoCodeInput } from './ProPromoCodeInput';
import { useTranslation } from '../../hooks/translation';
import { ConfirmNotification } from '../settings/ProSettings';
import { ProChooseSubscriptionPlan } from './ProChooseSubscriptionPlan';
import { NotificationBlock, NotificationFooter, NotificationFooterPortal } from '../Notification';
import { useProPurchaseController } from '../../hooks/pro/useProPurchaseController';
import { ProSubscriptionLightHeader } from './ProSubscriptionLightHeader';
import { useDisclosure } from '../../hooks/useDisclosure';

export const ProPurchaseChooseScreen = () => {
    const formId = useId();
    const { isOpen: isPromoShown, onOpen: showPromo } = useDisclosure(false);
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
        <ContentWrapper onSubmit={handleSubmit(onSubmit)} id={formId}>
            <ProSubscriptionLightHeader
                titleKey="get_tonkeeper_pro"
                subtitleKey="choose_billing_description"
            />

            <ProActiveWallet isLoading={isLoading} onLogout={onLogout} />

            <ProChooseSubscriptionPlan
                isPromoShown={isPromoShown}
                onPromoInputShow={showPromo}
                isLoading={isLoading}
                selectedPlanId={selectedPlanId}
                onPlanIdSelection={setSelectedPlanId}
                productsForRender={productsForRender}
            />

            {isCrypto && isPromoShown && (
                <ProPromoCodeInput
                    value={promoCode}
                    onChange={setPromoCode}
                    promoCode={verifiedPromoCode}
                />
            )}

            <ProFeaturesList />

            <NotificationFooterPortal>
                <NotificationFooter>
                    <PurchaseButtonWrapper>
                        <Button
                            primary
                            fullWidth
                            size="large"
                            type="submit"
                            form={formId}
                            loading={isLoading}
                        >
                            <Label2>{t('continue_with_tonkeeper_pro')}</Label2>
                        </Button>
                        <ProLegalNote onManage={onManage} />
                    </PurchaseButtonWrapper>
                </NotificationFooter>
            </NotificationFooterPortal>

            <ConfirmNotification
                state={confirmState}
                onClose={onConfirmClose}
                waitResult={waitInvoice}
            />
        </ContentWrapper>
    );
};

const ContentWrapper = styled(NotificationBlock)`
    padding: 1rem 0 2rem;
`;

const PurchaseButtonWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 0;
    width: 100%;
`;
